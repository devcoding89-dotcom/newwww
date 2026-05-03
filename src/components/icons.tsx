import { Send } from "lucide-react";
import type { SVGProps } from "react";

export const Icons = {
  logo: (props: SVGProps<SVGSVGElement>) => (
    <Send className="h-6 w-6" {...props} />
  ),
};
