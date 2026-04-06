import type { Method } from "./method";
import type { Headers } from "../header";

export interface Request {
  method?: Method;
  url: URL;
  headers: Headers;
}