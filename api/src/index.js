export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;
    
    // Setup CORS & Content-Type Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };
    
    // Handle OPTIONS Preflight Request
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }
    
    try {
      // 1. GET /api/tasks — Retrieve all habits & todos
      if (path === '/api/tasks' && method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT * FROM tasks ORDER BY timestamp ASC'
        ).all();
        
        // Map numeric sqlite boolean back to standard boolean
        const formattedResults = results.map(row => ({
          ...row,
          completed: !!row.completed
        }));
        
        return new Response(JSON.stringify(formattedResults), { headers: corsHeaders });
      }
      
      // 2. POST /api/tasks — Save or edit a task
      if (path === '/api/tasks' && method === 'POST') {
        const task = await request.json();
        const completedVal = task.completed ? 1 : 0;
        
        const result = await env.DB.prepare(
          'INSERT INTO tasks (id, text, type, completed, timestamp) ' +
          'VALUES (?1, ?2, ?3, ?4, ?5) ' +
          'ON CONFLICT(id) DO UPDATE SET ' +
          'text = excluded.text, ' +
          'completed = excluded.completed, ' +
          'timestamp = excluded.timestamp ' +
          'RETURNING *'
        ).bind(task.id, task.text, task.type, completedVal, task.timestamp).first();
        
        if (result) {
          result.completed = !!result.completed;
        }
        
        return new Response(JSON.stringify(result || task), { headers: corsHeaders });
      }
      
      // 3. DELETE /api/tasks/:id — Delete a task
      if (path.startsWith('/api/tasks/') && method === 'DELETE') {
        const id = path.split('/').pop();
        if (!id) {
          return new Response(JSON.stringify({ error: 'Missing task ID' }), { status: 400, headers: corsHeaders });
        }
        
        await env.DB.prepare('DELETE FROM tasks WHERE id = ?1').bind(id).run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }
      
      // 4. GET /api/kpi — Fetch full history of daily scores
      if (path === '/api/kpi' && method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT * FROM kpis ORDER BY date ASC'
        ).all();
        
        return new Response(JSON.stringify(results), { headers: corsHeaders });
      }
      
      // 5. POST /api/kpi — Upsert daily score
      if (path === '/api/kpi' && method === 'POST') {
        const kpi = await request.json();
        
        const result = await env.DB.prepare(
          'INSERT INTO kpis (date, score) ' +
          'VALUES (?1, ?2) ' +
          'ON CONFLICT(date) DO UPDATE SET ' +
          'score = excluded.score ' +
          'RETURNING *'
        ).bind(kpi.date, kpi.score).first();
        
        return new Response(JSON.stringify(result || kpi), { headers: corsHeaders });
      }
      
      // 404 handler
      return new Response(JSON.stringify({ error: 'Route not found' }), {
        status: 404,
        headers: corsHeaders
      });
      
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: corsHeaders
      });
    }
  }
};
