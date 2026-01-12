import { SanitizationPipe } from './sanitization.pipe';
import { ArgumentMetadata } from '@nestjs/common';

describe('SanitizationPipe', () => {
  let pipe: SanitizationPipe;

  beforeEach(() => {
    pipe = new SanitizationPipe();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should sanitize string fields in object', () => {
    const maliciousPayload = {
      name: 'John <script>alert("xss")</script>',
      bio: '<b>Bold</b> and <i>Italic</i>',
    };

    const metadata: ArgumentMetadata = { type: 'body' };
    const result = pipe.transform(maliciousPayload, metadata);

    expect(result.name).toBe('John ');
    expect(result.bio).toBe('Bold and Italic');
  });

  it('should recursively sanitize nested objects', () => {
    const nestedPayload = {
      user: {
        profile: {
          about: '<img src=x onerror=alert(1)>Hack',
        },
      },
    };

    const metadata: ArgumentMetadata = { type: 'body' };
    const result = pipe.transform(nestedPayload, metadata);

    expect(result.user.profile.about).toBe('Hack');
  });

  it('should ignore non-string fields', () => {
    const mixedPayload = {
      score: 100,
      isActive: true,
      tags: ['<p>tag1</p>', 'tag2'],
    };

    const metadata: ArgumentMetadata = { type: 'body' };
    const result = pipe.transform(mixedPayload, metadata);

    expect(result.score).toBe(100);
    expect(result.isActive).toBe(true);
    // Arrays might not be recursively sanitized depending on implementation, let's check
    expect(result.tags[0]).toBe('tag1');
  });

  it('should return value as is if not an object', () => {
    const result = pipe.transform('simple string', { type: 'query' });
    expect(result).toBe('simple string');
  });
});
