# API Testing Guide

This guide covers automated testing for the Traffic Flow Bot API using multiple approaches.

## 🧪 Automated Tests (Jest + Supertest)

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test health.test.ts
```

### Test Structure

```
tests/
├── setup.ts              # Test configuration
├── health.test.ts         # Health endpoint tests
└── api.test.ts           # All API endpoint tests
```

### What's Tested

- ✅ **Health endpoint** - Status, timestamp, uptime validation
- ✅ **API info endpoint** - Version, endpoints, metadata
- ✅ **Auth routes** - Placeholder responses
- ✅ **Protected routes** - User and HERE API endpoints
- ✅ **Error handling** - 404 responses
- ✅ **Security headers** - CORS, Helmet middleware
- ✅ **Response formats** - JSON structure validation

### Example Test Output

```
 PASS  tests/health.test.ts
 PASS  tests/api.test.ts

Test Suites: 2 passed, 2 total
Tests:       12 passed, 12 total
Snapshots:   0 total
Time:        2.345 s
```

## 🚀 Bruno API Testing

### Setup Bruno

1. **Install Bruno** (if not already installed):
   ```bash
   # macOS
   brew install bruno

   # Or download from https://www.usebruno.com/
   ```

2. **Open Bruno Collection**:
   ```bash
   # Navigate to the API tests directory
   cd backend/api-tests
   
   # Open in Bruno
   bruno .
   ```

### Bruno Collection Structure

```
api-tests/
├── bruno.json                    # Collection configuration
├── environments/
│   └── local.bru                # Local environment variables
├── Health/
│   └── Get Health.bru           # Health endpoint test
├── API Info/
│   └── Get API Info.bru         # Root endpoint test
├── Auth/
│   └── Get Auth User.bru        # Auth endpoint test
└── Error Handling/
    └── 404 Test.bru             # Error handling test
```

### Environment Variables

The Bruno collection uses these variables:
- `baseUrl`: http://localhost:3001
- `apiVersion`: v1

### Running Bruno Tests

1. **Start your server**:
   ```bash
   npm run dev
   ```

2. **Open Bruno and run tests**:
   - Individual tests: Click "Send" on any request
   - Run all tests: Use Bruno's collection runner
   - View test results in the Bruno interface

## 🔧 Manual Testing

### cURL Commands

```bash
# Health check
curl http://localhost:3001/health

# API info
curl http://localhost:3001/

# Auth endpoint
curl http://localhost:3001/auth/user

# Protected endpoints (currently no auth required)
curl http://localhost:3001/api/user/profile
curl http://localhost:3001/api/here/flow

# Test 404 handling
curl http://localhost:3001/nonexistent
```

### HTTPie Commands

```bash
# Install httpie
brew install httpie

# Test endpoints
http GET localhost:3001/health
http GET localhost:3001/
http GET localhost:3001/auth/user
```

## 📊 Test Coverage

Run coverage report to see what's tested:

```bash
npm run test:coverage
```

This generates:
- Terminal coverage summary
- HTML report in `coverage/` directory
- LCOV report for CI/CD integration

## 🚨 Testing Best Practices

### Automated Tests
- ✅ Test all endpoints
- ✅ Validate response structure
- ✅ Check status codes
- ✅ Test error conditions
- ✅ Verify security headers

### Bruno Tests
- ✅ Use environment variables
- ✅ Add assertions for each response
- ✅ Test different HTTP methods
- ✅ Document expected behavior
- ✅ Group related tests in folders

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: API Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

## 🐛 Debugging Tests

### Common Issues

1. **Server not starting**: Check environment variables
2. **Tests timing out**: Increase timeout in jest.config.js
3. **Connection refused**: Ensure server is running on correct port
4. **Supabase errors**: Check database connection

### Debug Commands

```bash
# Run tests with verbose output
npm test -- --verbose

# Run single test file
npm test health.test.ts

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

## 📈 Adding New Tests

### For Jest/Supertest

1. Create test file in `tests/` directory
2. Import `request` from `supertest` and `app`
3. Write describe blocks for endpoints
4. Add assertions for responses

### For Bruno

1. Create new folder in `api-tests/`
2. Add `.bru` files for each endpoint
3. Include tests section with assertions
4. Use environment variables for URLs

## 🎯 Next Steps

- [ ] Add authentication tests when auth is implemented
- [ ] Add HERE API integration tests
- [ ] Add database integration tests
- [ ] Add performance/load testing
- [ ] Add contract testing for frontend integration 