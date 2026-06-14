import { describe, it, expect } from 'vitest';
import { MOCK_USERS, MOCK_REPORTS, MOCK_DEVREQS, CATEGORIES, DEMO_APPS } from '../data';

describe('data.ts exports', () => {
  describe('MOCK_USERS', () => {
    it('contains the expected number of users', () => {
      expect(MOCK_USERS).toHaveLength(4);
    });

    it('each user has required fields', () => {
      for (const user of MOCK_USERS) {
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('role');
        expect(user).toHaveProperty('status');
        expect(user).toHaveProperty('joinedAt');
      }
    });

    it('contains valid roles', () => {
      const validRoles = ['user', 'developer', 'admin'];
      for (const user of MOCK_USERS) {
        expect(validRoles).toContain(user.role);
      }
    });

    it('contains valid statuses', () => {
      const validStatuses = ['active', 'suspended'];
      for (const user of MOCK_USERS) {
        expect(validStatuses).toContain(user.status);
      }
    });

    it('has at least one admin', () => {
      expect(MOCK_USERS.some(u => u.role === 'admin')).toBe(true);
    });

    it('has unique IDs', () => {
      const ids = MOCK_USERS.map(u => u.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('MOCK_REPORTS', () => {
    it('is a non-empty array', () => {
      expect(MOCK_REPORTS.length).toBeGreaterThan(0);
    });

    it('each report has required fields', () => {
      for (const report of MOCK_REPORTS) {
        expect(report).toHaveProperty('id');
        expect(report).toHaveProperty('type');
        expect(report).toHaveProperty('target');
        expect(report).toHaveProperty('reason');
        expect(report).toHaveProperty('status');
      }
    });
  });

  describe('MOCK_DEVREQS', () => {
    it('is a non-empty array', () => {
      expect(MOCK_DEVREQS.length).toBeGreaterThan(0);
    });

    it('each request has required fields', () => {
      for (const req of MOCK_DEVREQS) {
        expect(req).toHaveProperty('id');
        expect(req).toHaveProperty('user');
        expect(req).toHaveProperty('email');
        expect(req).toHaveProperty('status');
        expect(req).toHaveProperty('date');
      }
    });
  });

  describe('CATEGORIES', () => {
    it('contains 10 categories', () => {
      expect(CATEGORIES).toHaveLength(10);
    });

    it('each category has required fields', () => {
      for (const cat of CATEGORIES) {
        expect(cat).toHaveProperty('id');
        expect(cat).toHaveProperty('name');
        expect(cat).toHaveProperty('icon');
        expect(cat).toHaveProperty('color');
        expect(cat.name.length).toBeGreaterThan(0);
        expect(cat.icon.length).toBeGreaterThan(0);
      }
    });

    it('has unique IDs', () => {
      const ids = CATEGORIES.map(c => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('has unique names', () => {
      const names = CATEGORIES.map(c => c.name);
      expect(new Set(names).size).toBe(names.length);
    });
  });

  describe('DEMO_APPS', () => {
    it('contains 4 demo apps', () => {
      expect(DEMO_APPS).toHaveLength(4);
    });

    it('each app has required AppItem fields', () => {
      for (const app of DEMO_APPS) {
        expect(app).toHaveProperty('id');
        expect(app).toHaveProperty('name');
        expect(app).toHaveProperty('developer');
        expect(app).toHaveProperty('rating');
        expect(app).toHaveProperty('downloads');
        expect(app).toHaveProperty('category');
        expect(app).toHaveProperty('icon');
        expect(app).toHaveProperty('price');
      }
    });

    it('all demo apps are published', () => {
      for (const app of DEMO_APPS) {
        expect(app.status).toBe('published');
      }
    });

    it('ratings are within valid range', () => {
      for (const app of DEMO_APPS) {
        expect(app.rating).toBeGreaterThanOrEqual(0);
        expect(app.rating).toBeLessThanOrEqual(5);
      }
    });

    it('icons are valid URLs', () => {
      for (const app of DEMO_APPS) {
        expect(app.icon).toMatch(/^https?:\/\//);
      }
    });

    it('has unique IDs', () => {
      const ids = DEMO_APPS.map(a => a.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
