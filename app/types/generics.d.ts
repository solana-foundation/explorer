import type { ComponentProps, ComponentType } from "react";

/**
 * Shortcut for defining a component type with props.
 */
export type CType<P = any> = ComponentType<P>

/**
 * Shortcut for defining component props.
 */
export type CProp<D> = ComponentProps<D>

