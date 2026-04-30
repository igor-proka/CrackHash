import http from 'k6/http';
import { check, sleep } from 'k6';

const targetUrl = __ENV.TARGET_URL || 'http://localhost:8082';
const clients = Number(__ENV.K6_VUS || 1000);
const duration = __ENV.K6_DURATION || '30s';
const pollStatus = (__ENV.K6_POLL_STATUS || __ENV.POLL_STATUS || 'false').toLowerCase() === 'true';
const maxLength = Number(__ENV.K6_MAX_LENGTH || 2);
const hash = __ENV.K6_HASH || '25ed1bcb423b0b7200f485fc5ff71c8e';
const sleepSeconds = Number(__ENV.K6_SLEEP_SECONDS || 1);

export const options = {
  scenarios: {
    crackhash_manager_load: {
      executor: 'constant-vus',
      vus: clients,
      duration,
      gracefulStop: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1500'],
  },
};

export default function () {
  const payload = JSON.stringify({
    hash,
    maxLength,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = http.post(`${targetUrl}/api/hash/crack`, payload, params);
  const accepted = check(response, {
    'request accepted': (r) => r.status === 200 && Boolean(r.json('requestId')),
  });

  if (!accepted || !pollStatus) {
    sleep(sleepSeconds);
    return;
  }

  const requestId = response.json('requestId');
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const statusResponse = http.get(`${targetUrl}/api/hash/status?requestId=${requestId}`);
    const status = statusResponse.json('status');

    check(statusResponse, {
      'status readable': (r) => r.status === 200,
      'status is known': () => ['QUEUED', 'IN_PROGRESS', 'READY', 'ERROR'].includes(status),
    });

    if (status === 'READY' || status === 'ERROR') {
      break;
    }

    sleep(sleepSeconds);
  }
}
