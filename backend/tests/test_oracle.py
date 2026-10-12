import json
import os
import unittest
from unittest.mock import patch

import httpx
from fastapi import FastAPI
from pydantic import ValidationError

from services.oracle import OracleQuestion, ResearchIndex, SearchInput, answer_question, infer_years, safe_url


RESEARCHERS = [
    {"_unique_id": "alice", "name": "Alice Martin", "category": "enseignants_chercheurs", "email": "private@example.com"},
    {"_unique_id": "bob", "name": "Bob Dupont"},
]
PUBLICATIONS = [
    {"halId_s": "hal-123", "title_s": ["Explainable AI for rockfalls"], "producedDateY_i": 2024,
     "keyword_s": ["XAI", "rockfalls"], "authFullName_s": ["Alice Martin", "External Author"],
     "listic_author_ids": ["alice"], "abstract_s": ["We explain rockfall forecasts using feature attribution."]},
    {"halId_s": "456", "title_s": "Graph clustering", "producedDateY_i": 2022,
     "keyword_s": "graph", "authFullName_s": "Bob Dupont", "listic_author_ids": ["bob"]},
]
DOCTORANTS = [{"name": "Student", "_unique_id": "student", "Sujet": "Explainable AI", "director": "Bob Dupont",
               "hal_data": {"hal_publications": [
                   {"hal_id": "000123", "citation": "Duplicate", "year": "2024"},
                   {"hal_id": "789", "citation": "Deep learning for forecasts", "year": "2025", "authors": "Alice Martin; Student", "keywords": "learning", "abstract": "A forecast model."},
               ]}}]


class Cursor:
    def __init__(self, rows):
        self.rows = rows

    def sort(self, *args):
        return self

    async def to_list(self, length):
        return self.rows[:length]


class Collection:
    def __init__(self, rows):
        self.rows = rows

    async def count_documents(self, query):
        return len(self.rows)

    def find(self, query, projection):
        # Honour projections, including the embedded publications field.
        fields = {key.split('.')[0] for key, include in projection.items() if include}
        return Cursor([{key: value for key, value in row.items() if key in fields} for row in self.rows])


class Database:
    def __init__(self):
        self.researchers = Collection(RESEARCHERS)
        self.doctorants = Collection(DOCTORANTS)
        self.publications = Collection(PUBLICATIONS)

    def __getitem__(self, name):
        return getattr(self, name)


class RetrievalTests(unittest.TestCase):
    def setUp(self):
        self.index = ResearchIndex(RESEARCHERS, DOCTORANTS, PUBLICATIONS, {"researchers": 2, "doctorants": 1, "warehouse_publications": 2})

    def test_deduplication_and_provenance(self):
        pubs = [s for s in self.index.sources if s['kind'] == 'publication']
        self.assertEqual(len(pubs), 3)
        self.assertEqual(sum(s['origin'] == 'Entrepôt HAL local' for s in pubs), 2)
        self.assertTrue(any('doctorants' in s['origin'] for s in pubs))

    def test_french_topic_returns_local_profiles_with_evidence(self):
        result = self.index.search(SearchInput(query="Quels chercheurs sont associés à l’IA explicable ?"), 'researcher')
        self.assertEqual(result['total_matches'], 2)
        self.assertEqual({s['title'] for s in result['sources'] if s['kind'] == 'researcher'}, {'Alice Martin', 'Bob Dupont'})
        self.assertTrue(any(s['kind'] == 'thesis' for s in result['sources']))
        self.assertNotIn('External Author', {s['title'] for s in result['sources'] if s['kind'] == 'researcher'})

    def test_author_search_years_and_string_fields(self):
        result = self.index.search(SearchInput(query='Alice Martin', start_year=2024, end_year=2024), 'publication')
        self.assertEqual(result['total_matches'], 1)
        self.assertEqual(result['sources'][0]['year'], 2024)
        self.assertEqual(infer_years('depuis 2024'), (2024, None))
        self.assertEqual(infer_years('entre 2022 et 2024'), (2022, 2024))
        with self.assertRaises(ValueError):
            self.index.search(SearchInput(start_year=2025, end_year=2022))

    def test_statistics_count_matches_before_result_limit(self):
        result = self.index.statistics(SearchInput(query='Combien de publications sont disponibles dans la base locale ?', limit=1))
        self.assertEqual(result['values']['matching_publications'], 3)
        self.assertEqual(result['values']['warehouse_publications'], 2)
        self.assertEqual(self.index.statistics(SearchInput(start_year=2024, end_year=2024))['values']['matching_publications'], 1)

    def test_unknown_topic_does_not_return_unrelated_profiles(self):
        self.assertEqual(self.index.search(SearchInput(query='astrophysique quantique'), 'researcher')['total_matches'], 0)

    def test_combined_topics_need_more_than_a_generic_ai_match(self):
        index = ResearchIndex(RESEARCHERS, [], [{"halId_s": "999", "title_s": "Artificial intelligence for graphs", "listic_author_ids": ["bob"]}], {"researchers": 2, "doctorants": 0, "warehouse_publications": 1})
        self.assertEqual(index.search(SearchInput(query='IA explicable'), 'researcher')['total_matches'], 0)

    def test_filtered_counts_have_distinct_citations(self):
        all_years = self.index.statistics(SearchInput())
        single_year = self.index.statistics(SearchInput(start_year=2024, end_year=2024))
        self.assertNotEqual(all_years['sources'][0]['id'], single_year['sources'][0]['id'])

    def test_invalid_input_and_unsafe_links(self):
        for value in ['   ', 'x' * 1001]:
            with self.assertRaises(ValidationError):
                OracleQuestion(question=value)
        for url in ['javascript:alert(1)', 'https://secret@example.com', '//example.com']:
            self.assertIsNone(safe_url(url))


class AssistantTests(unittest.IsolatedAsyncioTestCase):
    async def test_no_key_uses_real_local_results(self):
        with patch.dict(os.environ, {'GEMINI_API_KEY': ''}):
            result = await answer_question(Database(), 'Combien de publications sont disponibles ?')
        self.assertEqual(result['mode'], 'local')
        self.assertEqual(result['coverage']['indexed_publications'], 3)
        self.assertEqual(result['tools_used'], ['get_statistics'])
        self.assertIn('[' + result['sources'][0]['id'] + ']', result['answer'])
        self.assertNotIn('private@example.com', json.dumps(result))

    async def test_no_results_explains_missing_evidence(self):
        with patch.dict(os.environ, {'GEMINI_API_KEY': ''}):
            result = await answer_question(Database(), 'astrophysique quantique')
        self.assertEqual(result['sources'], [])
        self.assertIn('Cela ne signifie pas', result['answer'])

    async def gemini_result(self, final=None, status=200):
        requests = []
        def provider(request):
            payload = json.loads(request.content)
            requests.append(payload)
            self.assertEqual(request.url.host, 'generativelanguage.googleapis.com')
            self.assertNotIn('private@example.com', request.content.decode())
            if status != 200:
                return httpx.Response(status, json={'error': 'Do not leak this provider payload'})
            if payload.get('tool_choice') == 'required':
                message = {'content': None, 'tool_calls': [{'id': f'call-{len(requests)}', 'type': 'function', 'function': {'name': 'get_statistics', 'arguments': '{"query":""}'}}]}
            else:
                tool = json.loads(next(m['content'] for m in reversed(payload['messages']) if m['role'] == 'tool'))
                sid = tool['sources'][0]['id']
                message = {'content': json.dumps(final or {'answer': f'Le corpus indexé contient 3 publications. [{sid}]', 'source_ids': [sid]})}
            return httpx.Response(200, json={'choices': [{'message': message}]})
        with patch.dict(os.environ, {'GEMINI_API_KEY': 'test-only-key'}):
            async with httpx.AsyncClient(transport=httpx.MockTransport(provider)) as client:
                result = await answer_question(Database(), 'Combien de publications ?', client=client)
        return result, requests

    async def test_agent_executes_tools_and_returns_valid_citations(self):
        result, requests = await self.gemini_result()
        self.assertEqual(result['mode'], 'gemini')
        self.assertEqual(len(requests), 3)
        self.assertEqual(result['sources'][0]['kind'], 'statistics')
        self.assertEqual(result['tools_used'], ['get_statistics'])

    async def test_invented_source_and_uncited_answers_fall_back(self):
        for final in [
            {'answer': 'Une réponse [invented]', 'source_ids': ['invented']},
            {'answer': 'Une affirmation sans citation', 'source_ids': ['statistics']},
        ]:
            result, _ = await self.gemini_result(final)
            self.assertEqual(result['mode'], 'local')
            self.assertTrue(any('références valides' in w for w in result['warnings']))

    async def test_provider_failure_falls_back_without_error_details(self):
        result, requests = await self.gemini_result(status=429)
        self.assertEqual(len(requests), 1)
        self.assertEqual(result['mode'], 'local')
        self.assertNotIn('provider payload', json.dumps(result))
        self.assertNotIn('test-only-key', json.dumps(result))

    async def test_api_validates_request_and_response(self):
        # Load the real endpoint in an isolated app without startup sync workers.
        import main
        app = FastAPI()
        app.add_api_route('/api/oracle', main.query_oracle, methods=['POST'])
        with patch.object(main, 'db', Database()), patch.dict(os.environ, {'GEMINI_API_KEY': ''}):
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://test') as client:
                self.assertEqual((await client.post('/api/oracle', json={'question': '  '})).status_code, 422)
                response = await client.post('/api/oracle', json={'question': 'publications sur rockfalls'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['mode'], 'local')
        self.assertTrue(response.json()['sources'])


if __name__ == '__main__':
    unittest.main()
