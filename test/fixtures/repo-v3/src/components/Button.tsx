import * as React from "react";

const intents = {
  primary: "bg-primary text-primary-foreground",
  secondary: "border border-border bg-background",
  danger: "bg-danger text-white",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  intent?: keyof typeof intents;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({ intent = "primary", size = "md", loading, className, ...props }: ButtonProps) {
  return <button className={`rounded-md px-4 py-2 text-sm ${intents[intent]} ${className ?? ""}`} disabled={loading || props.disabled} {...props} />;
}
