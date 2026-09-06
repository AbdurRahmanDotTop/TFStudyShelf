import test from 'node:test';
import assert from 'node:assert';

const API_URL = 'http://127.0.0.1:8787/api/v1';
const ADMIN_API_URL = 'http://127.0.0.1:8787/api/v1/admin';

test('Course CRUD Operations', async (t) => {

  await t.test('should get courses list', async () => {
    const response = await fetch(`${API_URL}/courses`);
    const data = await response.json();
    assert.strictEqual(response.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(Array.isArray(data.data), true);
  });
  
  await t.test('should return 401 for admin course endpoints without auth', async () => {
    const courseData = {
      title: 'Test Course',
      description: 'Test Description',
      status: 'DRAFT',
    };

    const response = await fetch(`${ADMIN_API_URL}/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(courseData)
    });
    
    assert.strictEqual(response.status, 401);
  });

});
