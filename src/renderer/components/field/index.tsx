import { type InputHTMLAttributes } from "react";
import styles from "./field.module.css";

function Field(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={styles.input} type="text" readOnly {...props} />;
}

export { Field };
