import { type PropsWithChildren } from "react";
import styles from "./group.module.css";

function Group(props: PropsWithChildren) {
  return <div className={styles.group} {...props} />;
}

export { Group };
