import { classNames } from "@eulersoft/classnames";
import { type PropsWithChildren } from "react";
import styles from "./sidebar.module.css";

interface SectionProps {
  disabled?: boolean;
  fill?: boolean;
  scroll?: boolean;
}

function Section({
  disabled,
  fill,
  scroll,
  ...rest
}: PropsWithChildren<SectionProps>) {
  return (
    <section
      className={classNames(
        styles.section,
        fill && styles.fill,
        scroll && styles.scroll,
        disabled && styles.disabled,
      )}
      inert={disabled}
      {...rest}
    />
  );
}

function Heading(props: PropsWithChildren) {
  return <h2 className={styles.heading} {...props} />;
}

function Sidebar(props: PropsWithChildren) {
  return <aside className={styles.wrapper} {...props} />;
}

Sidebar.Section = Section;
Sidebar.Heading = Heading;

export { Sidebar };
