// Example test file to demonstrate testing patterns

describe('Example Test Suite', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('Unit Tests', () => {
    it('should demonstrate a basic test', () => {
      // Arrange
      const input = 'hello';
      const expected = 'HELLO';

      // Act
      const result = input.toUpperCase();

      // Assert
      expect(result).toBe(expected);
    });

    it('should test async functions', async () => {
      // Arrange
      const asyncFunction = async () => {
        return new Promise((resolve) => {
          setTimeout(() => resolve('async result'), 100);
        });
      };

      // Act
      const result = await asyncFunction();

      // Assert
      expect(result).toBe('async result');
    });

    it('should test with custom matchers', () => {
      // Test UUID
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(uuid).toBeValidUUID();

      // Test email
      const email = 'test@example.com';
      expect(email).toBeValidEmail();
    });
  });

  describe('Integration Tests', () => {
    it('should test multiple components together', () => {
      // Test integration between components
      expect(true).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', () => {
      // Arrange
      const errorFunction = () => {
        throw new Error('Test error');
      };

      // Act & Assert
      expect(errorFunction).toThrow('Test error');
    });

    it('should handle async errors', async () => {
      // Arrange
      const asyncErrorFunction = async () => {
        throw new Error('Async test error');
      };

      // Act & Assert
      await expect(asyncErrorFunction()).rejects.toThrow('Async test error');
    });
  });

  describe('Mocking', () => {
    it('should mock functions', () => {
      // Arrange
      const mockFunction = jest.fn();
      mockFunction.mockReturnValue('mocked value');

      // Act
      const result = mockFunction();

      // Assert
      expect(mockFunction).toHaveBeenCalled();
      expect(result).toBe('mocked value');
    });

    it('should mock modules', () => {
      // Arrange
      const fs = require('fs');
      (fs.readFileSync as jest.Mock).mockReturnValue('file content');

      // Act
      const content = fs.readFileSync('test.txt');

      // Assert
      expect(fs.readFileSync).toHaveBeenCalledWith('test.txt');
      expect(content).toBe('file content');
    });
  });

  describe('Parameterized Tests', () => {
    const testCases = [
      { input: 1, expected: 2 },
      { input: 2, expected: 4 },
      { input: 3, expected: 6 },
    ];

    test.each(testCases)('should double $input to equal $expected', ({ input, expected }) => {
      // Act
      const result = input * 2;

      // Assert
      expect(result).toBe(expected);
    });
  });
});