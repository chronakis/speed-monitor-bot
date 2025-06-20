import request from 'supertest';
import app from '../src/app';

describe('API Endpoints', () => {
  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Traffic Flow Bot API');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('status', 'running');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body.endpoints).toHaveProperty('health', '/health');
      expect(response.body.endpoints).toHaveProperty('auth', '/auth');
      expect(response.body.endpoints).toHaveProperty('user', '/api/user');
      expect(response.body.endpoints).toHaveProperty('here', '/api/here');
    });
  });

  describe('Auth Routes', () => {
    describe('GET /auth/user', () => {
      it('should return auth placeholder', async () => {
        const response = await request(app)
          .get('/auth/user')
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Auth routes - TODO');
      });
    });
  });

  describe('Protected Routes', () => {
    describe('GET /api/user/profile', () => {
      it('should return user placeholder', async () => {
        const response = await request(app)
          .get('/api/user/profile')
          .expect(200);

        expect(response.body).toHaveProperty('message', 'User routes - TODO');
      });
    });

    describe('GET /api/here/flow', () => {
      it('should return HERE API placeholder', async () => {
        const response = await request(app)
          .get('/api/here/flow')
          .expect(200);

        expect(response.body).toHaveProperty('message', 'HERE API routes - TODO');
      });
    });
  });

  describe('Error Handling', () => {
    describe('GET /nonexistent', () => {
      it('should return 404 for non-existent routes', async () => {
        const response = await request(app)
          .get('/nonexistent')
          .expect(404);

        expect(response.body).toHaveProperty('error', 'Endpoint not found');
        expect(response.body).toHaveProperty('path', '/nonexistent');
        expect(response.body).toHaveProperty('method', 'GET');
      });
    });

    describe('POST /nonexistent', () => {
      it('should return 404 for non-existent POST routes', async () => {
        const response = await request(app)
          .post('/nonexistent')
          .expect(404);

        expect(response.body).toHaveProperty('error', 'Endpoint not found');
        expect(response.body).toHaveProperty('path', '/nonexistent');
        expect(response.body).toHaveProperty('method', 'POST');
      });
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Helmet should add security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });
}); 