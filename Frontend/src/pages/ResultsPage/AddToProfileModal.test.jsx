// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import AddToProfileModal from "./AddToProfileModal";

afterEach(cleanup);

function renderModal(props = {}) {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onClose = vi.fn();
  render(
    <AddToProfileModal
      candidates={["SQL", "Docker"]}
      onSave={onSave}
      onClose={onClose}
      {...props}
    />,
  );
  return { onSave, onClose };
}

describe("AddToProfileModal", () => {
  it("lists every skill ticked, with a button that says how many will be saved", () => {
    renderModal();

    expect(screen.getByRole("dialog", { name: "Add skills to your profile" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "SQL" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Docker" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Save 2 skills" })).toBeEnabled();
  });

  it("updates the count when a skill is unticked and disables saving at zero", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("checkbox", { name: "Docker" }));
    expect(screen.getByRole("button", { name: "Save 1 skill" })).toBeEnabled();

    await user.click(screen.getByRole("checkbox", { name: "SQL" }));
    expect(screen.getByRole("button", { name: "Save 0 skills" })).toBeDisabled();
  });

  it("saves only the ticked skills", async () => {
    const user = userEvent.setup();
    const { onSave } = renderModal();

    await user.click(screen.getByRole("checkbox", { name: "Docker" }));
    await user.click(screen.getByRole("button", { name: "Save 1 skill" }));

    expect(onSave).toHaveBeenCalledWith(["SQL"]);
  });

  it("adds a skill the user typed, ticked, and clears the box", async () => {
    const user = userEvent.setup();
    const { onSave } = renderModal();

    await user.type(screen.getByLabelText("Add a skill I have"), "  Figma  {Enter}");

    expect(screen.getByRole("checkbox", { name: "Figma" })).toBeChecked();
    expect(screen.getByLabelText("Add a skill I have")).toHaveValue("");
    await user.click(screen.getByRole("button", { name: "Save 3 skills" }));
    expect(onSave).toHaveBeenCalledWith(["SQL", "Docker", "Figma"]);
  });

  it("doesn't add a skill twice (ignoring case) and re-ticks an unticked one", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("checkbox", { name: "SQL" }));
    await user.type(screen.getByLabelText("Add a skill I have"), "sql{Enter}");

    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    expect(screen.getByRole("checkbox", { name: "SQL" })).toBeChecked();
  });

  it("keeps the dialog open and shows the message if saving fails", async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal({
      onSave: vi.fn().mockRejectedValue(new Error("You can save up to 200 skills.")),
    });

    await user.click(screen.getByRole("button", { name: "Save 2 skills" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("You can save up to 200 skills.");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save 2 skills" })).toBeEnabled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("disables the buttons while saving", async () => {
    const user = userEvent.setup();
    renderModal({ onSave: vi.fn(() => new Promise(() => {})) });

    await user.click(screen.getByRole("button", { name: "Save 2 skills" }));

    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });

  it("closes with the Cancel button, the Escape key, or a click outside", async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.keyboard("{Escape}");
    fireEvent.mouseDown(screen.getByRole("dialog").parentElement);

    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("doesn't close when clicking inside the dialog", () => {
    const { onClose } = renderModal();

    fireEvent.mouseDown(screen.getByRole("dialog"));

    expect(onClose).not.toHaveBeenCalled();
  });
});