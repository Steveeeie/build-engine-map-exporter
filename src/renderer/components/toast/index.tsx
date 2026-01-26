import { useEffect, useState } from "react";
import { classNames } from "@eulersoft/classnames";

import styles from "./toast.module.css";
import { Icon } from "../icon";

type ToastVariant = "info" | "success" | "error";

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  onClose: () => void;
}

function Toast({ message, variant = "info", onClose }: ToastProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setExiting(true);
      onClose();
    }, 5000);

    return () => {
      clearTimeout(exitTimer);
    };
  }, [message, onClose]);

  return (
    <div
      className={classNames(
        styles.wrapper,
        styles[variant],
        exiting && styles.exiting,
      )}
    >
      {variant === "success" && <Icon name="checked" variant="success" />}
      {variant === "error" && <Icon name="error" variant="error" />}
      {message}
    </div>
  );
}

export { Toast, type ToastVariant };
