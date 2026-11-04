import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/** Toasts styled with ClassSync tokens. */
const Toaster = (props: ToasterProps) => (
  <Sonner
    position="bottom-right"
    toastOptions={{
      classNames: {
        toast: "!rounded-2xl !border !border-line !bg-paper !text-ink !shadow-lift !font-sans",
        title: "!font-semibold",
        description: "!text-ink-muted",
        actionButton: "!rounded-full !bg-plum !text-cream",
      },
    }}
    {...props}
  />
);

export { Toaster };
