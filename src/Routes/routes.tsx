import { lazy } from "react";

import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";

import App from "./../App";

// Lazy Loaded Components
const HomePage = lazy(() => import("./../Pages/HomePage/HomePage"));
const FeedbackPage = lazy(() => import("../Pages/FeedbackPage/FeedbackPage"));
const PageNotFound = lazy(() => import("../Pages/PageNotFound/PageNotFound"));

const Router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/feedback" element={<FeedbackPage />} />
      <Route path="*" element={<PageNotFound />} />
    </Route>
  )
);

export default Router;
