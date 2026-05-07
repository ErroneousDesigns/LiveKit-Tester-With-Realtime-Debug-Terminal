import { createBrowserRouter } from "react-router";
import { SetupPage } from "./pages/SetupPage";
import { RoomPage } from "./pages/RoomPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: SetupPage,
  },
  {
    path: "/room",
    Component: RoomPage,
  },
]);