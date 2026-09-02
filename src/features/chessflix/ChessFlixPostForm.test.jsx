import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChessFlixPostForm } from "./ChessFlixPostForm.jsx";
import { __bootstrapStorage } from "../../lib/storage/storageBridge.js";

describe("ChessFlixPostForm", () => {
  beforeEach(async () => {
    await __bootstrapStorage();
  });

  it("shows the permission notice when the visitor cannot post", () => {
    render(<ChessFlixPostForm dark canPost={false} onBack={vi.fn()} onPosted={vi.fn()} />);
    expect(screen.getByText(/don&apos;t currently have permission|don't currently have permission/)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Enter content title...")).not.toBeInTheDocument();
  });

  it("shows the editor when the visitor can post", () => {
    render(<ChessFlixPostForm dark canPost onBack={vi.fn()} onPosted={vi.fn()} />);
    expect(screen.getByPlaceholderText("Enter content title...")).toBeInTheDocument();
  });

  // Regression: the editor's useState calls used to sit *after* an early return
  // on !canPost, so flipping the flag changed the hook count between renders and
  // crashed React with "Rendered more hooks than during the previous render".
  it("survives canPost flipping between renders", () => {
    const { rerender } = render(<ChessFlixPostForm dark canPost={false} onBack={vi.fn()} onPosted={vi.fn()} />);
    expect(() => {
      rerender(<ChessFlixPostForm dark canPost onBack={vi.fn()} onPosted={vi.fn()} />);
    }).not.toThrow();
    expect(screen.getByPlaceholderText("Enter content title...")).toBeInTheDocument();

    expect(() => {
      rerender(<ChessFlixPostForm dark canPost={false} onBack={vi.fn()} onPosted={vi.fn()} />);
    }).not.toThrow();
  });

  it("reports every missing required field at once", async () => {
    const user = userEvent.setup();
    render(<ChessFlixPostForm dark canPost onBack={vi.fn()} onPosted={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Post Content" }));

    expect(screen.getByText("• Title is required.")).toBeInTheDocument();
    expect(screen.getByText("• Description is required.")).toBeInTheDocument();
    expect(screen.getByText("• A video link is required.")).toBeInTheDocument();
  });

  it("rejects a video link that is not a URL", async () => {
    const user = userEvent.setup();
    render(<ChessFlixPostForm dark canPost onBack={vi.fn()} onPosted={vi.fn()} />);

    await user.type(screen.getByPlaceholderText("Enter content title..."), "Sicilian crash course");
    await user.type(screen.getByPlaceholderText("Describe your chess content..."), "Ten minutes on the Najdorf.");
    await user.type(screen.getByPlaceholderText(/Paste a YouTube/), "not-a-url");
    await user.click(screen.getByRole("button", { name: "Post Content" }));

    expect(screen.getByText("• Video link must be a valid URL.")).toBeInTheDocument();
  });

  it("calls onBack from the back link", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<ChessFlixPostForm dark canPost onBack={onBack} onPosted={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /Back to ChessFlix/ }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
