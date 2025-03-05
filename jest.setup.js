// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { fetch, Request, Response } from 'cross-fetch';

// Make fetch available globally
global.fetch = fetch;
global.Request = Request;
global.Response = Response;
