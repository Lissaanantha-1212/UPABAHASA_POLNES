import React from "react";
import SectionHeading from "../components/SectionHeading";
import OrganizationChart from "../components/OrganizationChart";

const container = "mx-auto w-full max-w-7xl px-5 md:px-8 lg:px-10";

export default function OrganizationSection() {
  return (
    <section
      id="struktur"
      className="scroll-mt-16 overflow-hidden bg-[#ffffff] pt-12 pb-24 md:pt-14 md:pb-28 lg:pt-16 lg:pb-32"
    >
      <div className={container}>
        <SectionHeading
          eyebrow="Organisasi"
          title="Struktur Organisasi"
          description="Susunan organisasi Unit Penunjang Akademik Bahasa Politeknik Negeri Samarinda."
          centered
        />

        <div className="mt-8 md:mt-10">
          <OrganizationChart />
        </div>
      </div>
    </section>
  );
}
