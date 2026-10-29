import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { Flip } from "gsap/Flip";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, Flip, ScrollSmoother, ScrollTrigger, SplitText);

export { Flip, gsap, ScrollSmoother, ScrollTrigger, SplitText, useGSAP };
