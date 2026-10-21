import { afterEach, expect } from 'bun:test';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';

// Adds matchers like toBeInTheDocument() and cleans the screen after each test.
expect.extend(matchers);
afterEach(cleanup);
