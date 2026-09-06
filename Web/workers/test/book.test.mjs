import test from 'node:test';
import assert from 'node:assert';

const API_URL = 'http://127.0.0.1:8787/api/v1';
const ADMIN_API_URL = 'http://127.0.0.1:8787/api/v1/admin';

test('Book CRUD Operations', async (t) => {

  await t.test('should get books list', async () => {
    const response = await fetch(`${API_URL}/books`);
    const data = await response.json();
    assert.strictEqual(response.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(Array.isArray(data.data), true);
  });
  
  await t.test('should return 401 for admin endpoints without auth', async () => {
    const bookData = {
      title: 'Test Book',
      description: 'Test Description',
      status: 'DRAFT',
    };

    const response = await fetch(`${ADMIN_API_URL}/books`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookData)
    });
    
    // We expect 401 since no Authorization header is provided
    assert.strictEqual(response.status, 401);
  });

});
