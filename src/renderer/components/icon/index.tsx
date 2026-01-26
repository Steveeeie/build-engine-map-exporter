import { classNames } from "@eulersoft/classnames";
import { paths } from "./paths";
import styles from "./icon.module.css";

type IconName = keyof typeof paths;

interface IconProps {
  name: IconName;
  variant?: "regular" | "success" | "error";
  size?: "tiny" | "small" | "medium";
}

function Icon({ name, size = "medium", variant = "regular" }: IconProps) {
  let value = 24;

  if (size === "small") value = 20;

  if (size === "tiny") value = 16;

  return (
    <svg
      className={classNames(styles.wrapper, styles[variant])}
      width={value}
      height={value}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="presentation"
    >
      <path d={paths[name]} fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

export { Icon };
