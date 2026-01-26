import { classNames } from "@eulersoft/classnames";
import { type ButtonHTMLAttributes } from "react";
import styles from "./button.module.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "medium" | "large";
  variant?: "primary" | "secondary";
  fill?: boolean;
}

function Button({
  variant = "secondary",
  size = "medium",
  fill,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={classNames(
        styles.wrapper,
        styles[size],
        styles[variant],
        fill && styles.fill,
      )}
      {...rest}
    />
  );
}

export { Button };
