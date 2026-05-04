import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";

export const ContainerScroll = ({
  titleComponent,
  children,
}: {
  titleComponent: React.ReactNode;
  children: React.ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const rotate = useTransform(scrollYProgress, [0, 1], [18, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], isMobile ? [0.9, 1] : [1.04, 1]);
  const translate = useTransform(scrollYProgress, [0, 1], [0, -84]);

  return (
    <div
      ref={containerRef}
      className="relative flex h-[58rem] items-center justify-center px-4 py-8 sm:h-[68rem] lg:h-[78rem] lg:px-8"
    >
      <div className="relative w-full py-10 lg:py-24" style={{ perspective: "1100px" }}>
        <ContainerHeader translate={translate} titleComponent={titleComponent} />
        <ContainerCard rotate={rotate} scale={scale}>
          {children}
        </ContainerCard>
      </div>
    </div>
  );
};

const ContainerHeader = ({
  translate,
  titleComponent,
}: {
  translate: MotionValue<number>;
  titleComponent: React.ReactNode;
}) => {
  return (
    <motion.div
      style={{ translateY: translate }}
      className="mx-auto max-w-4xl text-center"
    >
      {titleComponent}
    </motion.div>
  );
};

const ContainerCard = ({
  rotate,
  scale,
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  children: React.ReactNode;
}) => {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          "0 10px 30px rgba(0,0,0,0.28), 0 45px 90px rgba(0,0,0,0.36), 0 0 0 1px rgba(255,255,255,0.06)",
      }}
      className="mx-auto -mt-6 h-[28rem] w-full max-w-6xl rounded-[28px] border border-white/10 bg-[#171717] p-2 sm:-mt-8 sm:h-[34rem] lg:h-[42rem] lg:p-4"
    >
      <div className="h-full w-full overflow-hidden rounded-[22px] bg-[#0c0c0d]">
        {children}
      </div>
    </motion.div>
  );
};

export default ContainerScroll;
