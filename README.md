# Food Dispatch Frontend

This Next.js app now proxies all API requests through Next route handlers, so the browser never talks to the Go backend directly.

## Backend proxy configuration

Create a `.env.local` file with the backend coordinates:

```
FOOD_DISPATCH_API_BASE_URL=http://localhost:8080/api
# Optional granular overrides
# FOOD_DISPATCH_API_PROTOCOL=http
# FOOD_DISPATCH_API_HOST=localhost
# FOOD_DISPATCH_API_PORT=8080
# FOOD_DISPATCH_API_BASE_PATH=/api
# FOOD_DISPATCH_SESSION_COOKIE=fd_session
```

Run the backend separately, then start the frontend with `npm run dev`.



## Docker build and run


To test with docker

```
docker build -t food-dispatch-frontend .

docker run -p 3000:3000 food-dispatch-frontend

```
