"use client";

import { useEffect } from "react";

/**
 * CRMForm component embeds an external form provided by Clinical Marketer
 * via an iframe and loads the accompanying script.  This component
 * should be used instead of the internal LeadForm when you want to
 * capture user details directly into your CRM.  It will load the
 * necessary script on mount and clean it up on unmount.
 */
export default function CRMForm() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://link.clinicalmarketer.com/js/form_embed.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <iframe
      src="https://link.clinicalmarketer.com/widget/form/h2kREV9RfmwiIwtoY0nm"
      style={{ width: "100%", height: "432px", border: "none", borderRadius: "3px" }}
      id="inline-h2kREV9RfmwiIwtoY0nm"
      data-layout="{'id':'INLINE'}"
      data-trigger-type="alwaysShow"
      data-trigger-value=""
      data-activation-type="alwaysActivated"
      data-activation-value=""
      data-deactivation-type="neverDeactivate"
      data-deactivation-value=""
      data-form-name="Form 73"
      data-height="432"
      data-layout-iframe-id="inline-h2kREV9RfmwiIwtoY0nm"
      data-form-id="h2kREV9RfmwiIwtoY0nm"
      title="Form 73"
    ></iframe>
  );
}