import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Join conditional classes and resolve Tailwind utility conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
