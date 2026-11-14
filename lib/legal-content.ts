export type LegalBlock = {text?:string;items?:string[]};
export type LegalPolicy = {title:string;subtitle:string;intro:string;sections:{id:string;title:string;blocks:LegalBlock[]}[]};
export const LEGAL_EFFECTIVE_DATE = "14 November 2026";
export const LEGAL_POLICIES: Record<"privacy"|"terms",LegalPolicy> = {
  "privacy": {
    "title": "Privacy Policy",
    "subtitle": "Your records, and how we handle them.",
    "intro": "This policy explains how TailorFit handles information when you visit our website, create an account or use our workspace for measurements, client records and garment orders.",
    "sections": [
      {
        "id": "who-is-responsible",
        "title": "Who is responsible",
        "blocks": [
          {
            "text": "This policy applies to TailorFit. For privacy questions or requests, contact haysal618@gmail.com."
          },
          {
            "text": "We determine how account information and website operations are managed. When a tailoring business records its clients' details, that business generally decides why the information is collected and used; TailorFit processes those workspace records to provide the service. Responsibilities depend on the actual processing involved."
          }
        ]
      },
      {
        "id": "information-you-provide",
        "title": "Information you provide",
        "blocks": [
          {
            "text": "We handle the information you choose to enter, including:"
          },
          {
            "items": [
              "Account details such as your email address and profile information.",
              "Client names, phone numbers, email addresses and notes.",
              "Body measurements, fitting history, garment details and mannequin selections.",
              "Order prices, statuses, pickup dates and style-reference images.",
              "Messages you send to support."
            ]
          },
          {
            "text": "Authentication credentials are handled through our authentication provider. Do not send passwords through support messages. Avoid uploading identity documents, payment-card details, health information or other information unnecessary for tailoring work."
          }
        ]
      },
      {
        "id": "how-we-use-information",
        "title": "How we use information",
        "blocks": [
          {
            "text": "We use information to operate accounts, save and retrieve records, process your requested actions, provide support, troubleshoot problems and protect the service from misuse."
          },
          {
            "text": "For our own processing, the applicable legal basis may include performing our agreement with you, complying with legal obligations, or legitimate interests such as operating and securing the service, balanced against individuals' rights. Where consent is required, we will request it for the relevant activity. Tailoring businesses are responsible for establishing an appropriate basis for the client information they enter."
          },
          {
            "text": "We do not use client measurements or uploaded images for advertising or AI-model training."
          }
        ]
      },
      {
        "id": "online-records-and-device-storage",
        "title": "Online records and device storage",
        "blocks": [
          {
            "text": "Records successfully saved while you are signed in are stored online in your account's workspace. Saving requires an internet connection."
          },
          {
            "text": "Unfinished drafts may be stored in your browser on the device where you started them. Guest drafts become unavailable after 24 hours from their last update; this is not a guarantee that every stored copy is physically erased at that moment. Signing in on another device does not transfer an unfinished local draft. Browser settings, storage limits or clearing device data may remove it."
          }
        ]
      },
      {
        "id": "cookies-and-technical-information",
        "title": "Cookies and technical information",
        "blocks": [
          {
            "text": "TailorFit uses authentication cookies to maintain and refresh signed-in sessions. Browser storage also supports draft recovery and product preferences."
          },
          {
            "text": "Hosting and infrastructure providers may process technical information such as IP addresses, request times, browser details and error logs to deliver and protect the service."
          },
          {
            "text": "We do not currently use marketing analytics, advertising pixels or behavioural advertising. Necessary authentication and infrastructure processing still take place. If we introduce optional tracking, we will explain it and provide any choices required by applicable law."
          }
        ]
      },
      {
        "id": "providers-and-sharing",
        "title": "Providers and sharing",
        "blocks": [
          {
            "text": "Our infrastructure providers include Vercel, Google Cloud and Supabase. Supabase provides authentication, database records and private image storage."
          },
          {
            "text": "When invoice email sharing is enabled and you confirm a send, the selected client's email address and invoice contents are processed by our email provider, Resend, to send that message. The invoice can include contact details, measurements, garment information, reference images, price and due date. Downloaded or emailed copies may remain outside TailorFit after you delete the original record."
          },
          {
            "text": "We may disclose information when required by law or when reasonably necessary to address fraud, security incidents or legal claims, subject to applicable safeguards. We do not sell personal information."
          }
        ]
      },
      {
        "id": "storage-location-and-protection",
        "title": "Storage location and protection",
        "blocks": [
          {
            "text": "Infrastructure providers may process information outside Nigeria."
          },
          {
            "text": "The current application uses authenticated access, ownership checks and private image storage to restrict access to workspace records. No internet service can guarantee complete security. Human administrative access is currently limited to TailorFit’s operator, and should occur only when necessary for support you request, security, maintenance or legal obligations. Authorised infrastructure providers also process information to deliver their services. We do not routinely inspect the contents of your records. Protect your account and the devices you use to access it. Report suspected unauthorised access to our privacy contact."
          }
        ]
      },
      {
        "id": "how-long-information-is-kept",
        "title": "How long information is kept",
        "blocks": [
          {
            "text": "We keep saved workspace records while your account is active and they are needed to provide the service, unless you delete them earlier. Retention also depends on the purpose of the record, applicable legal requirements and any specific security investigation or dispute."
          },
          {
            "text": "Removing workspace records does not necessarily remove linked files, provider logs, backups or copies you have downloaded or emailed immediately. We do not promise automatic file cleanup or guaranteed recovery of deleted records."
          },
          {
            "text": "For account closure, deletion requests or information about retention of a particular record, contact haysal618@gmail.com. We will explain any information that must remain and why. Do not send your password with your request."
          }
        ]
      },
      {
        "id": "your-choices-and-rights",
        "title": "Your choices and rights",
        "blocks": [
          {
            "text": "Depending on applicable law and the circumstances, you may request access, correction, deletion or a copy of personal information; object to or seek restriction of certain processing; or withdraw consent where processing relies on it. Some requests may be subject to legal exceptions. Withdrawing consent does not affect earlier lawful processing."
          },
          {
            "text": "Contact haysal618@gmail.com with the type of request and the account email or tailoring business involved. Do not send your password or complete identity documents in your first message. We will use proportionate verification, such as confirming control of the registered email or checking authority to act for a client. We will respond within applicable legal deadlines and explain any permitted extension or reason a request cannot be fulfilled. If a tailor entered your information, contacting that business first may help; you can also contact us for assistance. You may raise a complaint with the Nigeria Data Protection Commission at https://ndpc.gov.ng/."
          }
        ]
      },
      {
        "id": "children-s-information",
        "title": "Children's information",
        "blocks": [
          {
            "text": "TailorFit accounts are intended for adult business users. If you record measurements or other information about a child as part of tailoring work, you must meet applicable requirements, including any necessary parent or guardian authorisation. Collect only what is needed. Use garment-only images or fully clothed reference pictures. Nude, semi-nude, sexually explicit and exploitative images are prohibited, including when a parent or guardian has consented to photography. Contact us if you believe children's information has been handled improperly."
          }
        ]
      },
      {
        "id": "updates-and-contact",
        "title": "Updates and contact",
        "blocks": [
          {
            "text": "We may update this policy as the service changes. The effective date will identify the current version. We will provide notice of material changes and seek consent where required."
          },
          {
            "text": "Privacy contact: haysal618@gmail.com\nOperator: TailorFit · haysal618@gmail.com"
          }
        ]
      }
    ]
  },
  "terms": {
    "title": "Terms of Use",
    "subtitle": "The terms for using your TailorFit workspace.",
    "intro": "These terms govern your use of TailorFit. Please read them before creating an account or using the workspace. If you do not agree, do not use the service. Contact haysal618@gmail.com with questions.",
    "sections": [
      {
        "id": "what-tailorfit-provides",
        "title": "What TailorFit provides",
        "blocks": [
          {
            "text": "TailorFit is a web application for recording client details, body measurements, fittings and garment orders. It helps organise the information you enter. It does not take body measurements automatically or guarantee that a garment will fit."
          },
          {
            "text": "You remain responsible for checking measurements, prices, pickup dates and other details before relying on them or sharing them with a client."
          }
        ]
      },
      {
        "id": "your-account",
        "title": "Your account",
        "blocks": [
          {
            "text": "You must be 18 or older and able to enter a binding agreement. If acting for a business, you must be authorised to do so."
          },
          {
            "text": "Provide accurate account information, protect your sign-in credentials and tell us if you suspect unauthorised access. Each account currently has one owner. Do not treat a plan name as permission to share credentials or as a promise of staff accounts or team permissions."
          }
        ]
      },
      {
        "id": "your-client-records-and-uploads",
        "title": "Your client records and uploads",
        "blocks": [
          {
            "text": "You retain your rights in the content you provide. You give TailorFit the limited permission needed to host, store, display and process that content to provide the service and carry out your instructions."
          },
          {
            "text": "You are responsible for having the necessary rights and lawful basis to upload client information and images, informing clients appropriately, and keeping records accurate. Do not upload unlawful content, images you lack permission to use, or unnecessary sensitive information."
          },
          {
            "text": "Our Privacy Policy explains how information is handled. These terms do not replace any data-processing agreement required for your use of the service."
          }
        ]
      },
      {
        "id": "acceptable-use",
        "title": "Acceptable use",
        "blocks": [
          {
            "text": "Do not access another person's records without permission, bypass access controls, distribute malicious software, disrupt the service, use it for fraud or unlawful activity, or copy and resell the service without authorisation."
          },
          {
            "text": "Do not use TailorFit to send unsolicited messages or share a client's information with an unauthorised recipient. Reference pictures must be decent: use garment-only images or fully clothed people. Nude, semi-nude, sexually explicit or exploitative images are not allowed. Never upload child sexual abuse material, non-consensual intimate imagery, threats, harassment or content that infringes another person’s rights. Security testing requires prior written authorisation, except where applicable law provides otherwise."
          }
        ]
      },
      {
        "id": "saving-and-availability",
        "title": "Saving and availability",
        "blocks": [
          {
            "text": "You can explore some tools without an account. Creating clients and saving online records requires authentication and an internet connection. A draft on your device is not confirmation that a record has been saved online."
          },
          {
            "text": "Check save confirmations and keep appropriate recovery copies. We may need to interrupt access for maintenance, updates or security work. We do not promise uninterrupted availability, automatic backups or recovery of every lost draft."
          }
        ]
      },
      {
        "id": "invoices-and-client-communications",
        "title": "Invoices and client communications",
        "blocks": [
          {
            "text": "Review the saved client details, measurements, images, price and due date before downloading or sending an invoice. Share only with the client or a recipient the client has authorised, using an appropriate lawful basis. A confirmation click is an instruction to TailorFit, not proof of the client’s consent. Where email sharing is available, you are responsible for confirming the intended recipient and your authority to share the contents."
          },
          {
            "text": "Provider acceptance does not guarantee that an email reaches the recipient's inbox. TailorFit's invoice document does not calculate tax or establish that an order has been paid unless those capabilities are expressly provided."
          }
        ]
      },
      {
        "id": "plans-and-charges",
        "title": "Plans and charges",
        "blocks": [
          {
            "text": "TailorFit currently presents Free, Solo and Fashion House plans. Paid checkout is not yet available. Displayed plan information does not itself authorise a charge."
          },
          {
            "text": "Before paid subscriptions become available, we will show the applicable price, billing period, included allowances and payment, renewal, cancellation and refund terms before purchase. We will obtain the required purchase authorisation. Any annual discount applies to the annual total displayed for that purchase."
          }
        ]
      },
      {
        "id": "changes-suspension-and-account-closure",
        "title": "Changes, suspension and account closure",
        "blocks": [
          {
            "text": "We may update features or restrict access where reasonably necessary for security, unlawful activity, serious misuse or breach of these terms. Where practicable and lawful, we will explain material restrictions and provide an opportunity to resolve the issue or retrieve records. Urgent security or legal action may require immediate restriction."
          },
          {
            "text": "You may stop using TailorFit at any time. Contact haysal618@gmail.com to request account closure. Record deletion, file cleanup and retained copies follow the Privacy Policy and applicable legal obligations."
          },
          {
            "text": "To report prohibited content or appeal a restriction, contact haysal618@gmail.com. We will consider the information available and take proportionate action. This may include removing content, restricting a feature or suspending access. Where safe and lawful, we will explain the reason and allow an opportunity to respond. We do not promise to inspect every upload or detect every violation."
          }
        ]
      },
      {
        "id": "ownership-of-tailorfit",
        "title": "Ownership of TailorFit",
        "blocks": [
          {
            "text": "TailorFit's branding, interface and software belong to its operator or licensors. Using the service does not transfer ownership of those materials to you. Your own client records and uploaded content remain subject to the rights described above."
          }
        ]
      },
      {
        "id": "responsibility-and-limitations",
        "title": "Responsibility and limitations",
        "blocks": [
          {
            "text": "You are responsible for your tailoring services and agreements with clients, including garment quality, fitting decisions, prices, payments and pickup commitments. TailorFit is not a party to those agreements."
          },
          {
            "text": "We cannot guarantee that the service will be error-free or available at all times. Nothing in these terms excludes rights, remedies or liabilities that cannot lawfully be excluded."
          }
        ]
      },
      {
        "id": "applicable-law-and-disputes",
        "title": "Applicable law and disputes",
        "blocks": [
          {
            "text": "These terms are governed by the laws of the Federal Republic of Nigeria, subject to mandatory protections that apply to you. Please contact haysal618@gmail.com first so we can try to resolve a concern. Nothing here prevents you from exercising applicable statutory rights or approaching a competent regulator or court."
          }
        ]
      },
      {
        "id": "updates-and-contact",
        "title": "Updates and contact",
        "blocks": [
          {
            "text": "We may revise these terms as the service changes. We will identify the effective date and notify you of material changes. Where required, we will seek renewed acceptance. Changes will not retrospectively remove rights that have already arisen."
          },
          {
            "text": "Support: haysal618@gmail.com\nOperator: TailorFit · haysal618@gmail.com"
          }
        ]
      }
    ]
  }
};
