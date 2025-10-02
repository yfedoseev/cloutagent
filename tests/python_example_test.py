"""Example pytest test file to demonstrate testing patterns."""

import pytest
from unittest.mock import Mock, patch, MagicMock
from typing import Any, Dict, List
import asyncio


class TestExampleSuite:
    """Example test suite demonstrating pytest patterns."""

    def setup_method(self) -> None:
        """Set up test fixtures before each test method."""
        self.sample_data = {"key": "value", "number": 42}

    def teardown_method(self) -> None:
        """Tear down test fixtures after each test method."""
        pass

    def test_basic_assertion(self) -> None:
        """Test basic assertions."""
        # Arrange
        input_value = "hello"
        expected = "HELLO"

        # Act
        result = input_value.upper()

        # Assert
        assert result == expected

    def test_with_fixtures(self, sample_fixture: Dict[str, Any]) -> None:
        """Test using pytest fixtures."""
        assert "test_key" in sample_fixture
        assert sample_fixture["test_key"] == "test_value"

    @pytest.mark.parametrize(
        "input_val,expected",
        [
            (1, 2),
            (2, 4),
            (3, 6),
            (0, 0),
        ],
    )
    def test_parameterized(self, input_val: int, expected: int) -> None:
        """Test with multiple parameters."""
        # Act
        result = input_val * 2

        # Assert
        assert result == expected

    def test_exception_handling(self) -> None:
        """Test exception handling."""
        with pytest.raises(ValueError, match="Test error"):
            raise ValueError("Test error")

    def test_with_mock(self) -> None:
        """Test using mocks."""
        # Arrange
        mock_function = Mock(return_value="mocked result")

        # Act
        result = mock_function("test_arg")

        # Assert
        mock_function.assert_called_once_with("test_arg")
        assert result == "mocked result"

    @patch("builtins.open")
    def test_with_patch(self, mock_open: MagicMock) -> None:
        """Test using patch decorator."""
        # Arrange
        mock_open.return_value.__enter__.return_value.read.return_value = "file content"

        # Act
        with open("test.txt", "r") as f:
            content = f.read()

        # Assert
        mock_open.assert_called_once_with("test.txt", "r")
        assert content == "file content"

    @pytest.mark.asyncio
    async def test_async_function(self) -> None:
        """Test async functions."""

        async def async_function() -> str:
            await asyncio.sleep(0.01)
            return "async result"

        # Act
        result = await async_function()

        # Assert
        assert result == "async result"

    def test_list_operations(self) -> None:
        """Test list operations."""
        # Arrange
        test_list = [1, 2, 3, 4, 5]

        # Act & Assert
        assert len(test_list) == 5
        assert 3 in test_list
        assert test_list[0] == 1
        assert test_list[-1] == 5

    def test_dictionary_operations(self) -> None:
        """Test dictionary operations."""
        # Act & Assert
        assert "key" in self.sample_data
        assert self.sample_data["key"] == "value"
        assert self.sample_data.get("nonexistent") is None

    @pytest.mark.slow
    def test_slow_operation(self) -> None:
        """Test marked as slow (can be skipped with -m "not slow")."""
        import time

        time.sleep(0.1)
        assert True

    @pytest.mark.skip(reason="Feature not implemented yet")
    def test_future_feature(self) -> None:
        """Test that is skipped."""
        assert False

    @pytest.mark.xfail(reason="Known bug")
    def test_known_failure(self) -> None:
        """Test that is expected to fail."""
        assert False


class TestApiExample:
    """Example API testing patterns."""

    @pytest.fixture
    def mock_api_client(self) -> Mock:
        """Mock API client fixture."""
        client = Mock()
        client.get.return_value = {"status": "ok", "data": []}
        client.post.return_value = {"status": "created", "id": 123}
        return client

    def test_api_get(self, mock_api_client: Mock) -> None:
        """Test API GET request."""
        # Act
        response = mock_api_client.get("/users")

        # Assert
        mock_api_client.get.assert_called_once_with("/users")
        assert response["status"] == "ok"

    def test_api_post(self, mock_api_client: Mock) -> None:
        """Test API POST request."""
        # Arrange
        user_data = {"name": "John Doe", "email": "john@example.com"}

        # Act
        response = mock_api_client.post("/users", data=user_data)

        # Assert
        mock_api_client.post.assert_called_once_with("/users", data=user_data)
        assert response["status"] == "created"
        assert "id" in response


# Global fixtures
@pytest.fixture
def sample_fixture() -> Dict[str, Any]:
    """Sample fixture for testing."""
    return {
        "test_key": "test_value",
        "numbers": [1, 2, 3],
        "nested": {"inner": "value"},
    }


@pytest.fixture(scope="session")
def database_connection() -> str:
    """Session-scoped fixture (setup once per test session)."""
    # Setup
    connection = "mock_database_connection"
    yield connection
    # Teardown
    pass


@pytest.fixture(autouse=True)
def setup_test_environment() -> None:
    """Auto-use fixture that runs for every test."""
    # This runs before each test automatically
    pass


# Custom markers configuration (add to pytest.ini or pyproject.toml):
# [tool.pytest.ini_options]
# markers = [
#     "slow: marks tests as slow (deselect with '-m \"not slow\"')",
#     "integration: marks tests as integration tests",
#     "unit: marks tests as unit tests",
# ]
