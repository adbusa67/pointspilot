import { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export default function Card({
  children,
  className = "",
  ...rest
}: CardProps) {
  return (
    <div
      className={`glass rounded-2xl p-6 shadow-xl shadow-black/20 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
