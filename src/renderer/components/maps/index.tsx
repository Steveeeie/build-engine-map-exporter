import { type PropsWithChildren, type ButtonHTMLAttributes } from "react";
import { Icon } from "../icon";
import styles from "./maps.module.css";

interface ItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

function Item({ children, selected, ...rest }: PropsWithChildren<ItemProps>) {
  return (
    <li className={styles.item}>
      <button className={styles.button} {...rest}>
        {children} {selected && <Icon variant="success" name="checked" />}
      </button>
    </li>
  );
}

function Maps(props: PropsWithChildren) {
  return <ul className={styles.maps} {...props} />;
}

Maps.Item = Item;

export { Maps };
