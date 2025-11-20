/**
 * Mock de React Router DOM para testing
 * @fileoverview Proporciona implementaciones mock de react-router-dom
 */

import { vi } from "vitest";

export const mockNavigate = vi.fn();
export const mockLocation = {
  pathname: "/test-path",
  search: "",
  state: null,
  hash: "",
};

export const mockParams = {
  eventoId: "test-evento-id",
  userId: "test-user-id",
};

// React Router hooks mockeados
export const useNavigate = vi.fn(() => mockNavigate);
export const useLocation = vi.fn(() => mockLocation);
export const useParams = vi.fn(() => mockParams);
export const useSearchParams = vi.fn(() => [new URLSearchParams(), vi.fn()]);

// Componentes de React Router mockeados
export const BrowserRouter = ({ children }) => children;
export const Routes = ({ children }) => children;
export const Route = ({ children }) => children;
export const Navigate = vi.fn(() => null);
export const Link = ({ children, to, ...props }) => (
  <a href={to} {...props}>
    {children}
  </a>
);

// Funciones de utilidad mock
export const createMemoryRouter = vi.fn();
export const createBrowserRouter = vi.fn();

export default {
  mockNavigate,
  mockLocation,
  mockParams,
  useNavigate,
  useLocation,
  useParams,
  useSearchParams,
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
};
