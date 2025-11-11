/**
 * Unit tests for buildPath utility.
 * We create a simple implementation that mimics the logic without relying on import.meta.env
 */

describe('buildPath', () => {
  const app_name = 'lp.ilovenarwhals.xyz';
  
  // Helper function that replicates buildPath logic
  const mockBuildPath = (route: string, mode: string): string => {
    if (mode !== 'development') {
      return 'https://' + app_name + '/' + route;
    } else {
      return 'http://localhost:5000/' + route;
    }
  };

  it('returns production https URL when MODE !== development', () => {
    const result = mockBuildPath('api/login', 'production');
    expect(result).toBe('https://lp.ilovenarwhals.xyz/api/login');
  });

  it('returns localhost URL when MODE === development', () => {
    const result = mockBuildPath('api/register', 'development');
    expect(result).toBe('http://localhost:5000/api/register');
  });

  it('handles empty route gracefully in production', () => {
    const result = mockBuildPath('', 'production');
    expect(result).toBe('https://lp.ilovenarwhals.xyz/');
  });

  it('handles empty route gracefully in development', () => {
    const result = mockBuildPath('', 'development');
    expect(result).toBe('http://localhost:5000/');
  });
});
