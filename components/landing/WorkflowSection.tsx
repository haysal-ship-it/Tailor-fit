import Image from 'next/image';
import { SolvaReveal as Reveal } from './SolvaReveal';
import styles from './landing.module.css';

export function WorkflowSection() { return (
      <section id="how-it-works" tabIndex={-1} aria-labelledby="workflow-heading" className={`${styles.container} ${styles.section}`}>
        {/* Section Header */}
        <Reveal className={styles.sectionIntro}>
          <div className="max-w-[480px]">
            <h2 id="workflow-heading" className={styles.heading}>
              From client details to the next fitting.
            </h2>
          </div>
          <div className="max-w-[480px]">
            <p className={styles.body}>
              Capture measurements with an interactive mannequin, save client details, and keep track of what&apos;s due.
            </p>
          </div>
        </Reveal>

        {/* 3 Step Cards Grid */}
        <div className={styles.workflow}>
          {/* Card 01 - Add your client */}
          <div className="min-w-0">
            <Reveal className={styles.workflowVisual} delay={0}>
              {/* Noisy Gradient Backgrounds */}



              {/* Floating Miniature "Basic Information" Form Card */}
              <div className="relative w-full max-w-[320px] bg-white rounded-[16px] p-5 shadow-xl border border-neutral-100 flex flex-col gap-3">
                <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
                  <span className="text-[16px] font-semibold text-black">Basic Information</span>
                </div>
                <div className="flex flex-col gap-2.5">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-neutral-600">Client</span>
                    <div className="px-3 py-2 bg-[#F8F8F8] rounded-[8px] text-[13px] text-neutral-600 border border-neutral-200/50">
                      e.g Adriana Kunle
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-neutral-600">Garment Type</span>
                    <div className="px-3 py-2 bg-[#F8F8F8] rounded-[8px] text-[13px] text-neutral-600 border border-neutral-200/50">
                      Bespoke African Gown
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-medium text-neutral-600">Phone</span>
                      <div className="px-2.5 py-2 bg-[#F8F8F8] rounded-[8px] text-[12px] text-neutral-600 border border-neutral-200/50 truncate">
                        +234 -
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-medium text-neutral-600">Email</span>
                      <div className="px-2.5 py-2 bg-[#F8F8F8] rounded-[8px] text-[12px] text-neutral-600 border border-neutral-200/50 truncate">
                        name@example.com
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Text description */}
            <div className="flex flex-col gap-2">
              <h3 >Add your client</h3>
              <p className={styles.body}>
                Enter their contact details and the garment you&apos;re making.
              </p>
            </div>
          </div>

          {/* Card 02 - Record the fitting */}
          <div className="min-w-0">
            <Reveal className={styles.workflowVisual} delay={60}>
              {/* Noisy Gradient Background */}
              <div className="absolute inset-0 pointer-events-none opacity-90">
                <Image
                  src="/assets/landing/noisy-gradient-2.webp"
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 400px, 100vw"
                  className="object-cover"
                />
              </div>

              {/* Floating Miniature "Garment Templates" Card */}
              <div className="relative w-full max-w-[320px] bg-white rounded-[16px] p-5 shadow-xl border border-neutral-100 flex flex-col gap-3">
                <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
                  <span className="text-[14px] font-semibold text-black">Garment Templates</span>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="p-3 bg-[#F8F9FF] border border-[#287CF1] rounded-[8px] flex flex-col gap-0.5">
                    <span className="text-[12px] font-semibold text-[#1D49E8]">Shirt / Blouse</span>
                    <span className="text-[10px] text-neutral-600">Essential measurements for bespoke dress shirts</span>
                  </div>
                  <div className="p-2.5 bg-white border border-neutral-200 rounded-[8px] flex flex-col gap-0.5 opacity-90">
                    <span className="text-[12px] font-medium text-neutral-800">Trousers / Shorts</span>
                    <span className="text-[10px] text-neutral-600">Fittings for tailored or pleated pants</span>
                  </div>
                  <div className="p-2.5 bg-white border border-neutral-200 rounded-[8px] flex flex-col gap-0.5 opacity-90">
                    <span className="text-[12px] font-medium text-neutral-800">Gown / Dress</span>
                    <span className="text-[10px] text-neutral-600">Evening wear, party gowns, bridal</span>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-neutral-100">
                  <div className="px-3 py-1 bg-neutral-100 text-neutral-600 rounded-full text-[11px] font-medium">
                    Cancel
                  </div>
                  <div className="px-3 py-1 bg-[#1D49E8] text-white rounded-full text-[11px] font-medium">
                    Choose Template
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Text description */}
            <div className="flex flex-col gap-2">
              <h3 >Record the fitting.</h3>
              <p className={styles.body}>
                Choose a garment template, then enter measurements on the mannequin or in List view.
              </p>
            </div>
          </div>

          {/* Card 03 - Keep the order together */}
          <div className="min-w-0">
            <Reveal className={styles.workflowVisual} delay={120}>
              {/* Noisy Gradient Background */}
              <div className="absolute inset-0 pointer-events-none opacity-90">
                <Image
                  src="/assets/landing/revision/e6240.png"
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 400px, 100vw"
                  className="object-cover"
                />
              </div>

              {/* Floating Miniature "Style References & Price" Card */}
              <div className="relative w-full max-w-[320px] flex flex-col gap-3">
                {/* Upload card */}
                <div className="bg-white rounded-[16px] p-4 shadow-xl border border-neutral-100 flex flex-col gap-2">
                  <span className="text-[13px] font-semibold text-black">Style References</span>
                  <div className="h-[80px] rounded-[10px] border border-dashed border-neutral-300 flex flex-col items-center justify-center gap-1.5 bg-neutral-50/50">
                    <div className="w-8 h-8 rounded-full bg-neutral-200/80 flex items-center justify-center text-neutral-700">
                      <Image
                        src="/assets/landing/cloud-arrow-up.svg"
                        alt=""
                        width={16}
                        height={16}
                        sizes="(min-width: 1024px) 400px, 100vw"
                        className="object-contain"
                      />
                    </div>
                    <span className="text-[11px] font-medium text-neutral-600">Tap to upload image</span>
                  </div>
                </div>

                {/* Price & Due Date Card */}
                <div className="bg-white rounded-[16px] p-4 shadow-xl border border-neutral-100 flex flex-col gap-2">
                  <span className="text-[13px] font-semibold text-black">Price / Due date</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-neutral-600">Price (₦)</span>
                      <div className="px-3 py-1.5 bg-[#F8F8F8] rounded-[8px] text-[12px] font-medium text-neutral-800 border border-neutral-200/60">
                        ₦85,000
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-neutral-600">Due Date</span>
                      <div className="px-3 py-1.5 bg-[#F8F8F8] rounded-[8px] text-[12px] font-medium text-neutral-800 border border-neutral-200/60">
                        09/10/2026
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Text description */}
            <div className="flex flex-col gap-2">
              <h3 >Keep the order together.</h3>
              <p className={styles.body}>
                Add style references, price and a due date. Return to the client&apos;s record when you need them.
              </p>
            </div>
          </div>
          <div className={styles.workflowWide}><Reveal className={styles.workflowVisual}><Image src="/assets/landing/revision/36f19.png" alt="TailorFit order details with measurements and reference images" fill sizes="(min-width:1024px) 620px, 100vw" className="object-contain" /></Reveal><div><h3>Share order details with clients</h3><p className={styles.body}>Add style references, price and a due date. Return to the client’s record when you need them.</p></div></div>
        </div>
      </section>


); }
