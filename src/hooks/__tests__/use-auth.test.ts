import { describe, test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "../use-auth";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

const mockSignIn = vi.mocked(signInAction);
const mockSignUp = vi.mocked(signUpAction);
const mockGetAnonWorkData = vi.mocked(getAnonWorkData);
const mockClearAnonWork = vi.mocked(clearAnonWork);
const mockGetProjects = vi.mocked(getProjects);
const mockCreateProject = vi.mocked(createProject);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAnonWorkData.mockReturnValue(null);
  mockGetProjects.mockResolvedValue([]);
});

describe("useAuth", () => {
  describe("initial state", () => {
    test("isLoading starts as false", () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(false);
    });

    test("exposes signIn, signUp, isLoading", () => {
      const { result } = renderHook(() => useAuth());
      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
      expect(typeof result.current.isLoading).toBe("boolean");
    });
  });

  describe("signIn", () => {
    test("returns the action result on success", async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockCreateProject.mockResolvedValue({ id: "proj-1" } as any);

      const { result } = renderHook(() => useAuth());
      let returned: any;
      await act(async () => {
        returned = await result.current.signIn("a@b.com", "pass");
      });

      expect(returned).toEqual({ success: true });
    });

    test("returns the action result on failure", async () => {
      mockSignIn.mockResolvedValue({ success: false, error: "Invalid credentials" });

      const { result } = renderHook(() => useAuth());
      let returned: any;
      await act(async () => {
        returned = await result.current.signIn("a@b.com", "wrong");
      });

      expect(returned).toEqual({ success: false, error: "Invalid credentials" });
    });

    test("sets isLoading to true during execution and false after", async () => {
      let resolveSignIn!: (v: any) => void;
      mockSignIn.mockReturnValue(new Promise((res) => { resolveSignIn = res; }));
      mockCreateProject.mockResolvedValue({ id: "proj-1" } as any);

      const { result } = renderHook(() => useAuth());

      let signInPromise: Promise<any>;
      act(() => {
        signInPromise = result.current.signIn("a@b.com", "pass");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSignIn({ success: false });
        await signInPromise!;
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("sets isLoading to false even when action throws", async () => {
      mockSignIn.mockRejectedValue(new Error("network error"));

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("a@b.com", "pass").catch(() => {});
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("does not call post-sign-in logic when sign-in fails", async () => {
      mockSignIn.mockResolvedValue({ success: false, error: "Bad password" });

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("a@b.com", "bad");
      });

      expect(mockGetAnonWorkData).not.toHaveBeenCalled();
      expect(mockGetProjects).not.toHaveBeenCalled();
      expect(mockCreateProject).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    test("passes email and password to the sign-in action", async () => {
      mockSignIn.mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("user@test.com", "secret123");
      });

      expect(mockSignIn).toHaveBeenCalledWith("user@test.com", "secret123");
    });
  });

  describe("signUp", () => {
    test("returns the action result on success", async () => {
      mockSignUp.mockResolvedValue({ success: true });
      mockCreateProject.mockResolvedValue({ id: "proj-2" } as any);

      const { result } = renderHook(() => useAuth());
      let returned: any;
      await act(async () => {
        returned = await result.current.signUp("a@b.com", "pass");
      });

      expect(returned).toEqual({ success: true });
    });

    test("returns the action result on failure", async () => {
      mockSignUp.mockResolvedValue({ success: false, error: "Email taken" });

      const { result } = renderHook(() => useAuth());
      let returned: any;
      await act(async () => {
        returned = await result.current.signUp("a@b.com", "pass");
      });

      expect(returned).toEqual({ success: false, error: "Email taken" });
    });

    test("sets isLoading to false even when action throws", async () => {
      mockSignUp.mockRejectedValue(new Error("network error"));

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signUp("a@b.com", "pass").catch(() => {});
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("does not call post-sign-in logic when sign-up fails", async () => {
      mockSignUp.mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signUp("a@b.com", "pass");
      });

      expect(mockGetAnonWorkData).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    test("passes email and password to the sign-up action", async () => {
      mockSignUp.mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signUp("new@test.com", "pw");
      });

      expect(mockSignUp).toHaveBeenCalledWith("new@test.com", "pw");
    });
  });

  describe("post-sign-in routing", () => {
    test("saves anon work as a project and redirects when anon messages exist", async () => {
      const anonWork = {
        messages: [{ role: "user", content: "make a button" }],
        fileSystemData: { "/App.tsx": {} },
      };
      mockSignIn.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(anonWork);
      mockCreateProject.mockResolvedValue({ id: "saved-proj" } as any);

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("a@b.com", "pass");
      });

      expect(mockCreateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: anonWork.messages,
          data: anonWork.fileSystemData,
        })
      );
      expect(mockClearAnonWork).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/saved-proj");
      expect(mockGetProjects).not.toHaveBeenCalled();
    });

    test("skips anon work when messages array is empty and redirects to most recent project", async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue({ messages: [], fileSystemData: {} });
      mockGetProjects.mockResolvedValue([{ id: "existing-proj" }] as any);

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("a@b.com", "pass");
      });

      expect(mockCreateProject).not.toHaveBeenCalled();
      expect(mockClearAnonWork).not.toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/existing-proj");
    });

    test("redirects to the first (most recent) project when user has projects", async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetProjects.mockResolvedValue([
        { id: "recent-proj" },
        { id: "older-proj" },
      ] as any);

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("a@b.com", "pass");
      });

      expect(mockCreateProject).not.toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/recent-proj");
    });

    test("creates a new project and redirects when user has no existing projects", async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: "brand-new" } as any);

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("a@b.com", "pass");
      });

      expect(mockCreateProject).toHaveBeenCalledWith(
        expect.objectContaining({ messages: [], data: {} })
      );
      expect(mockPush).toHaveBeenCalledWith("/brand-new");
    });

    test("new project name matches expected format when no projects exist", async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ id: "x" } as any);

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("a@b.com", "pass");
      });

      const name: string = mockCreateProject.mock.calls[0][0].name;
      expect(name).toMatch(/^New Design #\d+$/);
    });

    test("post-sign-in logic also runs after successful sign-up", async () => {
      mockSignUp.mockResolvedValue({ success: true });
      mockGetProjects.mockResolvedValue([{ id: "signup-proj" }] as any);

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signUp("new@test.com", "pw");
      });

      expect(mockPush).toHaveBeenCalledWith("/signup-proj");
    });

    test("null anon work falls through to getProjects", async () => {
      mockSignIn.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([{ id: "proj-x" }] as any);

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("a@b.com", "pass");
      });

      expect(mockGetProjects).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/proj-x");
    });
  });
});
