import { RouterProvider } from "react-router";
import { router } from "./routes";
import "@livekit/components-styles";

function App() {
  return <RouterProvider router={router} />;
}

export default App;