import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import axios from "axios";
import AnalysisHistoryPage from "../pages/AnalysisHistoryPage";

jest.mock("axios");

describe("AnalysisHistoryPage", () => {
    test("deleting an item removes it from the page", async () => {
        axios.get.mockResolvedValue({
            data: [
                { id: 1, file_name: "resume1.pdf", status: "completed" }
            ]
        });

        axios.delete.mockResolvedValue({ status: 200 });

        render(<AnalysisHistoryPage />);

        await waitFor(() => {
            expect(screen.getByText("resume1.pdf")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole("button", { name: /delete/i }));

        await waitFor(() => {
            expect(screen.queryByText("resume1.pdf")).toBeNull();
        });
    });
});
