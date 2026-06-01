(function attachCalculator(root) {
  "use strict";

  const bundle = root.AML_MODEL_BUNDLE;
  if (!bundle) {
    throw new Error("Missing AML_MODEL_BUNDLE. Load model_artifacts/model_bundle.js before app.js.");
  }

  const state = {
    model: "gate",
    lang: "en",
  };

  // Synthetic example for public demos; not derived from a study patient.
  const SYNTHETIC_EXAMPLE_INPUT = Object.freeze({
    age: 68,
    sex: "FM",
    disease_type: "primary",
    ecog_kps: 1,
    fab_type: "M5",
    wbc: 32.6,
    hgb: 86,
    plt: 48,
    ldh: 780,
    uric_acid: 410,
    pb_blast: 58,
    bm_blast: 82,
    complex_karyotype: "N",
    tp53_mut: "N",
    flt3_itd: "N",
    flt3_tkd: "N",
    npm1_mut: "N",
    ras_path_mut: "Y",
    kras_mut_detail: 1,
    nras_mut_detail: 0,
    ptpn11_mut_detail: 0,
    mrg_mut: "N",
    asxl1_mut_detail: 0,
    CD11b: 1,
    CD9: 0,
    CD13: 1,
    CD14: 1,
    CD15: 1,
  });

  const YES_NO_FIELDS = new Set([
    "complex_karyotype",
    "tp53_mut",
    "flt3_itd",
    "flt3_tkd",
    "npm1_mut",
    "ras_path_mut",
    "mrg_mut",
    "em_involve",
    "hepatosplenomegaly",
    "evi1_expr",
  ]);

  const BINARY_NUMERIC_FIELDS = new Set([
    "kras_mut_detail",
    "nras_mut_detail",
    "ptpn11_mut_detail",
    "asxl1_mut_detail",
    "ras_multi_detail",
    "mrg_known_any_detail",
    "mrg_other_detail",
    "CD11b",
    "CD9",
    "CD13",
    "CD14",
    "CD15",
    "kmt2a_ras_any_detail",
    "kmt2a_kras_or_tp53",
    "kmt2a_younger_kras_or_tp53",
    "kmt2a_secondary_or_complex",
  ]);

  const NUMERIC_FIELDS = new Set([
    "age",
    "ecog_kps",
    "wbc",
    "hgb",
    "plt",
    "ldh",
    "uric_acid",
    "pb_blast",
    "bm_blast",
    "log_wbc",
    "log_plt",
    "log_ldh",
    "log_uric_acid",
    "ras_gene_count_detail",
    "mrg_gene_count_detail",
    "kmt2a_age_x_kras",
    "kmt2a_age_x_tp53",
    "kmt2a_log_wbc_x_ras",
    "kmt2a_blast_burden_mean",
    "kmt2a_blast_x_ras",
    ...BINARY_NUMERIC_FIELDS,
  ]);

  const LABELS = {
    zh: {
      groups: {
        "基本信息": "基本信息",
        "血象/实验室": "血象/实验室",
        "遗传/核型": "遗传/核型",
        "免疫表型（可缺失）": "免疫表型（可缺失）",
      },
      fields: {
        age: "年龄",
        sex: "性别",
        disease_type: "疾病来源/背景",
        ecog_kps: "ECOG/KPS",
        available_eln_like_risk: "综合遗传风险",
        log_wbc: "log(WBC)",
        wbc: "WBC",
        hgb: "HGB",
        log_plt: "log(PLT)",
        plt: "Platelet",
        log_ldh: "log(LDH)",
        ldh: "LDH",
        log_uric_acid: "log(尿酸)",
        uric_acid: "尿酸",
        pb_blast: "外周血 blast",
        bm_blast: "骨髓 blast",
        complex_karyotype: "复杂核型",
        tp53_mut: "TP53 突变",
        flt3_itd: "FLT3-ITD",
        flt3_tkd: "FLT3-TKD",
        ras_path_mut: "RAS 通路突变",
        mrg_mut: "MRG 突变",
        npm1_mut: "NPM1 突变",
        fab_type: "FAB",
        kras_mut_detail: "KRAS",
        nras_mut_detail: "NRAS",
        ptpn11_mut_detail: "PTPN11",
        ras_gene_count_detail: "RAS 突变基因数",
        ras_multi_detail: "多个 RAS 相关基因突变",
        kmt2a_ras_any_detail: "任一 RAS 相关突变",
        asxl1_mut_detail: "ASXL1",
        mrg_known_any_detail: "任一 MRG 突变",
        mrg_other_detail: "其他 MRG 突变",
        mrg_gene_count_detail: "MRG 突变基因数",
        kmt2a_kras_or_tp53: "KRAS 或 TP53",
        kmt2a_younger_kras_or_tp53: "较年轻且 KRAS/TP53",
        kmt2a_secondary_or_complex: "继发或复杂核型",
        kmt2a_kras_tp53_combo: "KRAS/TP53 组合",
        kmt2a_ras_subtype: "RAS 相关突变类型",
        kmt2a_mrg_subtype: "MRG 突变类型",
        kmt2a_ras_mrg_combo: "RAS-MRG 组合",
        kmt2a_age_x_kras: "年龄 × KRAS",
        kmt2a_age_x_tp53: "年龄 × TP53",
        kmt2a_log_wbc_x_ras: "log(WBC) × RAS",
        kmt2a_blast_burden_mean: "平均 blast 比例",
        kmt2a_blast_x_ras: "Blast × RAS",
        CD11b: "CD11b",
        CD9: "CD9",
        CD13: "CD13",
        CD14: "CD14",
        CD15: "CD15",
      },
      values: {
        FM: "女",
        M: "男",
        primary: "初发",
        secondary: "继发/治疗相关",
        adverse_like: "不良风险",
        favorable_like: "良好风险",
        intermediate_like: "中等风险",
        signaling_or_mrg: "信号通路/MRG",
        unknown: "未知",
        Missing: "缺失",
        Y: "是",
        N: "否",
        "1": "是",
        "0": "否",
        both: "KRAS 和 TP53 均突变",
        KRAS_only: "仅 KRAS",
        TP53_only: "仅 TP53",
        neither: "均无",
        none: "无",
        multi: "多个",
        other_mrg: "其他 MRG",
      },
      units: {
        age: "岁",
      },
    },
    en: {
      groups: {
        "基本信息": "Basic information",
        "血象/实验室": "Blood count / laboratory",
        "遗传/核型": "Genetics / cytogenetics",
        "免疫表型（可缺失）": "Immunophenotype (optional)",
      },
      fields: {
        age: "Age",
        sex: "Sex",
        disease_type: "Disease origin/background",
        ecog_kps: "ECOG/KPS",
        available_eln_like_risk: "Integrated genetic risk",
        log_wbc: "log(WBC)",
        wbc: "WBC",
        hgb: "HGB",
        log_plt: "log(platelets)",
        plt: "Platelets",
        log_ldh: "log(LDH)",
        ldh: "LDH",
        log_uric_acid: "log(uric acid)",
        uric_acid: "Uric acid",
        pb_blast: "Peripheral blood blasts",
        bm_blast: "Bone marrow blasts",
        complex_karyotype: "Complex karyotype",
        tp53_mut: "TP53 mutation",
        flt3_itd: "FLT3-ITD",
        flt3_tkd: "FLT3-TKD",
        ras_path_mut: "RAS pathway mutation",
        mrg_mut: "MRG mutation",
        npm1_mut: "NPM1 mutation",
        fab_type: "FAB",
        kras_mut_detail: "KRAS",
        nras_mut_detail: "NRAS",
        ptpn11_mut_detail: "PTPN11",
        ras_gene_count_detail: "Number of RAS-related mutated genes",
        ras_multi_detail: "Multiple RAS-related mutations",
        kmt2a_ras_any_detail: "Any RAS-related mutation",
        asxl1_mut_detail: "ASXL1",
        mrg_known_any_detail: "Any MRG mutation",
        mrg_other_detail: "Other MRG mutation",
        mrg_gene_count_detail: "Number of MRG mutated genes",
        kmt2a_kras_or_tp53: "KRAS or TP53",
        kmt2a_younger_kras_or_tp53: "Younger with KRAS/TP53",
        kmt2a_secondary_or_complex: "Secondary disease or complex karyotype",
        kmt2a_kras_tp53_combo: "KRAS/TP53 combination",
        kmt2a_ras_subtype: "RAS-related mutation type",
        kmt2a_mrg_subtype: "MRG mutation type",
        kmt2a_ras_mrg_combo: "RAS-MRG combination",
        kmt2a_age_x_kras: "Age x KRAS",
        kmt2a_age_x_tp53: "Age x TP53",
        kmt2a_log_wbc_x_ras: "log(WBC) x RAS",
        kmt2a_blast_burden_mean: "Mean blast percentage",
        kmt2a_blast_x_ras: "Blasts x RAS",
        CD11b: "CD11b",
        CD9: "CD9",
        CD13: "CD13",
        CD14: "CD14",
        CD15: "CD15",
      },
      values: {
        FM: "Female",
        M: "Male",
        primary: "De novo",
        secondary: "Secondary / therapy-related",
        adverse_like: "Adverse-like",
        favorable_like: "Favorable-like",
        intermediate_like: "Intermediate-like",
        signaling_or_mrg: "Signaling/MRG",
        unknown: "Unknown",
        Missing: "Missing",
        Y: "Yes",
        N: "No",
        "1": "Yes",
        "0": "No",
        both: "Both KRAS and TP53",
        KRAS_only: "KRAS only",
        TP53_only: "TP53 only",
        neither: "Neither",
        none: "None",
        multi: "Multiple",
        other_mrg: "Other MRG",
      },
      units: {
        age: "years",
      },
    },
  };

  const I18N = {
    zh: {
      htmlLang: "zh-CN",
      docTitle: "KMT2A-MLLT3 AML OS/RFS 风险分层工具",
      title: "KMT2A-MLLT3 AML OS/RFS 风险分层工具",
      subtitle: "基于诊断时临床、实验室及遗传学信息，同步评估 OS 与 RFS 的相对风险分层及主要影响因素。",
      researchUse: "供临床研究参考，需结合患者整体情况综合判断",
      modelControl: "模型版本",
      coreModel: "基础模型",
      gateModel: "扩展模型",
      example: "填入示例",
      clear: "清空",
      resultNote: "结果显示的是相对风险分数及其在训练队列中的位置，不是 1/2/3 年绝对生存率或复发率。",
      osTitle: "总生存（OS）",
      rfsTitle: "无复发生存（RFS）",
      relativeRisk: "相对风险分数",
      percentile: "训练队列位置",
      riskGroup: "风险分层",
      low: "低风险",
      mid: "中风险",
      high: "高风险",
      lowerRisk: "降低风险",
      higherRisk: "升高风险",
      coreRisk: "核心模型项",
      responseScore: "治疗反应相关分数",
      adjustment: "交互修正项",
      finalRisk: "最终风险",
      notUsed: "未纳入",
      missingPrefix: "部分变量缺失，已按训练集缺失值规则填补：",
      missingTail: (count) => `等 ${count} 项`,
      inferenceError: (message) => `推理失败：${message}`,
      error: "错误",
      distributionTitle: "风险分布位置",
      distributionCaption: "曲线表示训练队列风险分数分布；两条虚线为低/中、高风险分层界值；箭头标出当前患者位置。",
      distributionAria: "训练队列风险分布图",
      currentPatient: "当前患者",
      lowZone: "低风险区",
      midZone: "中风险区",
      highZone: "高风险区",
      cohortPosition: "训练队列位置",
      hoverRisk: "风险分数",
      hoverPercentile: "训练队列位置",
      hoverGroup: "风险分层",
      waterfallTitle: "风险分解",
      waterfallCaption: "显示核心模型项和扩展交互项如何合成为最终相对风险。",
      coreOnlyWaterfall: "基础模型不包含 RAS/TP53 风险修正。",
      contributionTitle: "主要影响因素",
      contributionCaption: "条形方向表示该因素在当前输入下使相对风险升高或降低。",
      noContribution: "当前输入下没有可显示的主要影响因素",
      correctionTitle: "RAS/TP53 相关修正",
      correctionCaption: "这里显示扩展模型中的风险修正来源，不等同于 RAS 或 TP53 单个变量的 HR。",
      coreOnlyTerms: "基础模型不包含 RAS/TP53 相关风险修正。",
      noTerms: "当前输入下没有明显的 RAS/TP53 相关修正来源",
      metricTitle: "模型性能摘要",
      metricCaption: "本队列表观判别能力、bootstrap 校正后 C-index，以及 1/2/3 年 time-dependent AUC。",
      model: "模型",
      endpoint: "结局",
      cIndex: "C-index",
      correctedCIndex: "校正 C-index",
      auc1: "1年 AUC",
      auc2: "2年 AUC",
      auc3: "3年 AUC",
      nEvents: "训练样本/事件数",
      tableNote: "C-index 和 1/2/3 年 AUC 为本队列表观表现；校正 C-index 使用 bootstrap 估计乐观偏倚后得到。",
      emptyOption: "缺失/未知",
      placeholder: "可缺失",
    },
    en: {
      htmlLang: "en",
      docTitle: "KMT2A-MLLT3 AML OS/RFS Risk Stratification Tool",
      title: "KMT2A-MLLT3 AML OS/RFS Risk Stratification Tool",
      subtitle: "Estimate OS and RFS relative risk stratification and key contributing factors using diagnosis-time clinical, laboratory, and genetic information.",
      researchUse: "For clinical research reference; interpret together with the full clinical context",
      modelControl: "Model version",
      coreModel: "Basic model",
      gateModel: "Extended model",
      example: "Use example",
      clear: "Clear",
      resultNote: "Results show relative risk scores and their position in the training cohort, not calibrated 1-, 2-, or 3-year survival or relapse probabilities.",
      osTitle: "Overall survival (OS)",
      rfsTitle: "Relapse-free survival (RFS)",
      relativeRisk: "Relative risk score",
      percentile: "Training cohort position",
      riskGroup: "Risk group",
      low: "Low risk",
      mid: "Intermediate risk",
      high: "High risk",
      lowerRisk: "Lower risk",
      higherRisk: "Higher risk",
      coreRisk: "Core-model component",
      responseScore: "Treatment-response related score",
      adjustment: "Interaction component",
      finalRisk: "Final risk",
      notUsed: "Not used",
      missingPrefix: "Some variables were missing and filled using the training-cohort missing-value rules: ",
      missingTail: (count) => `and ${count} fields`,
      inferenceError: (message) => `Prediction failed: ${message}`,
      error: "Error",
      distributionTitle: "Position in Risk Distribution",
      distributionCaption: "The curve shows risk-score distribution in the training cohort; dashed lines mark the low/intermediate and intermediate/high cutoffs; the arrow marks this patient.",
      distributionAria: "Training-cohort risk distribution",
      currentPatient: "Current patient",
      lowZone: "Low-risk zone",
      midZone: "Intermediate-risk zone",
      highZone: "High-risk zone",
      cohortPosition: "Training cohort position",
      hoverRisk: "Risk score",
      hoverPercentile: "Training cohort position",
      hoverGroup: "Risk group",
      waterfallTitle: "Risk Breakdown",
      waterfallCaption: "Shows how the core-model component and extended interaction component combine into the final relative risk.",
      coreOnlyWaterfall: "The basic model does not include the RAS/TP53 risk adjustment.",
      contributionTitle: "Main Risk Drivers",
      contributionCaption: "Bars show whether each factor increases or decreases the relative risk score for the current input.",
      noContribution: "No main drivers to display for the current input",
      correctionTitle: "RAS/TP53-Related Adjustment",
      correctionCaption: "This lists sources of the extended model adjustment; it is not the HR of RAS or TP53 alone.",
      coreOnlyTerms: "The basic model does not include the RAS/TP53-related adjustment.",
      noTerms: "No substantial RAS/TP53-related adjustment source for the current input",
      metricTitle: "Model Performance Summary",
      metricCaption: "Apparent discrimination in the study cohort, bootstrap-corrected C-index, and 1-, 2-, and 3-year time-dependent AUC.",
      model: "Model",
      endpoint: "Endpoint",
      cIndex: "C-index",
      correctedCIndex: "Corrected C-index",
      auc1: "1y AUC",
      auc2: "2y AUC",
      auc3: "3y AUC",
      nEvents: "Training n/events",
      tableNote: "C-index and 1-, 2-, and 3-year AUCs are apparent performance in the study cohort; corrected C-index accounts for optimism estimated by bootstrap.",
      emptyOption: "Missing/unknown",
      placeholder: "Optional",
    },
  };

  function isMissing(value) {
    return (
      value === undefined ||
      value === null ||
      value === "" ||
      (typeof value === "number" && !Number.isFinite(value))
    );
  }

  function toNumber(value) {
    if (isMissing(value)) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function normalizeYesNo(value) {
    if (isMissing(value)) return "";
    const text = String(value).trim().toUpperCase();
    if (["Y", "YES", "1", "TRUE", "POS", "POSITIVE"].includes(text)) return "Y";
    if (["N", "NO", "0", "FALSE", "NEG", "NEGATIVE"].includes(text)) return "N";
    return text;
  }

  function yesFlag(value) {
    return normalizeYesNo(value) === "Y" ? 1 : 0;
  }

  function binaryFlag(value) {
    if (isMissing(value)) return null;
    const yn = normalizeYesNo(value);
    if (yn === "Y") return 1;
    if (yn === "N") return 0;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    return parsed > 0 ? 1 : 0;
  }

  function safeLog(value) {
    const parsed = toNumber(value);
    return parsed !== null && parsed > 0 ? Math.log(parsed) : null;
  }

  function sumKnown(values) {
    let sawKnown = false;
    let total = 0;
    values.forEach((value) => {
      if (!isMissing(value)) {
        sawKnown = true;
        total += Number(value) || 0;
      }
    });
    return sawKnown ? total : null;
  }

  function deriveFeatures(input) {
    const f = { ...input };

    Object.keys(f).forEach((key) => {
      if (f[key] === "") f[key] = null;
    });

    NUMERIC_FIELDS.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(f, key)) {
        f[key] = toNumber(f[key]);
      }
    });

    BINARY_NUMERIC_FIELDS.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(f, key)) {
        f[key] = binaryFlag(f[key]);
      }
    });

    YES_NO_FIELDS.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(f, key)) {
        f[key] = normalizeYesNo(f[key]) || null;
      }
    });

    if (!isMissing(f.sex)) {
      const sex = String(f.sex).trim().toUpperCase();
      if (["F", "FEMALE", "WOMAN", "女"].includes(sex)) f.sex = "FM";
      else if (["M", "MALE", "MAN", "男"].includes(sex)) f.sex = "M";
    }

    if (!isMissing(f.disease_type)) {
      const disease = String(f.disease_type).trim().toLowerCase();
      if (/secondary|therapy|t-mn|t-aml|mds|mpn|继发|治疗/.test(disease)) f.disease_type = "secondary";
      else if (/primary|de novo|初发/.test(disease)) f.disease_type = "primary";
    }

    if (!isMissing(f.fab_type)) {
      f.fab_type = String(f.fab_type).trim().toUpperCase();
    }

    [
      ["log_wbc", "wbc"],
      ["log_plt", "plt"],
      ["log_ldh", "ldh"],
      ["log_uric_acid", "uric_acid"],
    ].forEach(([logKey, rawKey]) => {
      if (isMissing(f[logKey])) f[logKey] = safeLog(f[rawKey]);
    });

    const kras = binaryFlag(f.kras_mut_detail);
    const nras = binaryFlag(f.nras_mut_detail);
    const ptpn11 = binaryFlag(f.ptpn11_mut_detail);
    const rasDetailSum = sumKnown([kras, nras, ptpn11]);
    if (isMissing(f.ras_gene_count_detail)) {
      if (rasDetailSum !== null) f.ras_gene_count_detail = rasDetailSum;
      else if (normalizeYesNo(f.ras_path_mut) === "Y") f.ras_gene_count_detail = 1;
      else if (normalizeYesNo(f.ras_path_mut) === "N") f.ras_gene_count_detail = 0;
    }
    if (isMissing(f.ras_multi_detail) && !isMissing(f.ras_gene_count_detail)) {
      f.ras_multi_detail = Number(f.ras_gene_count_detail) >= 2 ? 1 : 0;
    }

    const asxl1 = binaryFlag(f.asxl1_mut_detail);
    if (isMissing(f.mrg_gene_count_detail)) {
      if (!isMissing(asxl1)) f.mrg_gene_count_detail = asxl1;
      else if (normalizeYesNo(f.mrg_mut) === "Y") f.mrg_gene_count_detail = 1;
      else if (normalizeYesNo(f.mrg_mut) === "N") f.mrg_gene_count_detail = 0;
    }
    if (isMissing(f.mrg_known_any_detail) && !isMissing(f.mrg_gene_count_detail)) {
      f.mrg_known_any_detail = Number(f.mrg_gene_count_detail) >= 1 ? 1 : 0;
    }
    if (isMissing(f.mrg_other_detail) && !isMissing(f.mrg_known_any_detail)) {
      f.mrg_other_detail = Number(f.mrg_known_any_detail) === 1 && Number(asxl1 || 0) === 0 ? 1 : 0;
    }

    if (isMissing(f.available_eln_like_risk)) {
      const values = [
        f.tp53_mut,
        f.complex_karyotype,
        f.npm1_mut,
        f.flt3_itd,
        f.flt3_tkd,
        f.ras_path_mut,
        f.mrg_mut,
      ].map(normalizeYesNo);
      if (values.every((value) => !value)) {
        f.available_eln_like_risk = "unknown";
      } else if (normalizeYesNo(f.tp53_mut) === "Y" || normalizeYesNo(f.complex_karyotype) === "Y") {
        f.available_eln_like_risk = "adverse_like";
      } else if (normalizeYesNo(f.npm1_mut) === "Y" && normalizeYesNo(f.flt3_itd) !== "Y") {
        f.available_eln_like_risk = "favorable_like";
      } else if ([f.flt3_itd, f.flt3_tkd, f.ras_path_mut, f.mrg_mut].some((value) => normalizeYesNo(value) === "Y")) {
        f.available_eln_like_risk = "signaling_or_mrg";
      } else {
        f.available_eln_like_risk = "intermediate_like";
      }
    }

    if (isMissing(f.ecog_binary) && !isMissing(f.ecog_kps)) {
      const value = Number(f.ecog_kps);
      f.ecog_binary = value > 10 ? (value >= 80 ? "0-1" : ">=2") : value <= 1 ? "0-1" : ">=2";
    }
    if (isMissing(f.fab_binary)) {
      const fab = isMissing(f.fab_type) ? "" : String(f.fab_type).toUpperCase();
      if (["M1", "M2"].includes(fab)) f.fab_binary = "M1+M2";
      else if (["M4", "M5"].includes(fab)) f.fab_binary = "M4+M5";
      else if (fab) f.fab_binary = "Missing";
    }

    const kras0 = Number(binaryFlag(f.kras_mut_detail) || 0);
    const nras0 = Number(binaryFlag(f.nras_mut_detail) || 0);
    const ptpn110 = Number(binaryFlag(f.ptpn11_mut_detail) || 0);
    let rasCount = isMissing(f.ras_gene_count_detail) ? kras0 + nras0 + ptpn110 : Number(f.ras_gene_count_detail);
    if (normalizeYesNo(f.ras_path_mut) === "Y") rasCount = Math.max(rasCount, 1);
    const rasAny = kras0 + nras0 + ptpn110 + rasCount > 0 ? 1 : 0;
    const tp53 = yesFlag(f.tp53_mut);
    const complex = yesFlag(f.complex_karyotype);
    const mrgCount = isMissing(f.mrg_gene_count_detail) ? Number(asxl1 || 0) : Number(f.mrg_gene_count_detail);
    const mrgOther = Number(binaryFlag(f.mrg_other_detail) || 0);
    const age = toNumber(f.age);
    const young = age !== null && age <= 60 ? 1 : 0;
    const diseaseText = isMissing(f.disease_type) ? "" : String(f.disease_type).toLowerCase();
    const secondary = /secondary|therapy|t-mn|t-aml|mds|mpn/.test(diseaseText) ? 1 : 0;
    const blastValues = [toNumber(f.pb_blast), toNumber(f.bm_blast)].filter((value) => value !== null);
    const blastBurden = blastValues.length ? blastValues.reduce((a, b) => a + b, 0) / blastValues.length : null;

    f.kmt2a_ras_any_detail = rasAny;
    f.kmt2a_kras_or_tp53 = kras0 === 1 || tp53 === 1 ? 1 : 0;
    f.kmt2a_younger_kras_or_tp53 = young === 1 && f.kmt2a_kras_or_tp53 === 1 ? 1 : 0;
    f.kmt2a_secondary_or_complex = secondary === 1 || complex === 1 ? 1 : 0;
    f.kmt2a_kras_tp53_combo = kras0 === 1 && tp53 === 1 ? "both" : kras0 === 1 ? "KRAS_only" : tp53 === 1 ? "TP53_only" : "neither";
    f.kmt2a_ras_subtype =
      rasCount >= 2 ? "multi" : kras0 === 1 ? "KRAS" : nras0 === 1 ? "NRAS" : ptpn110 === 1 ? "PTPN11" : "none";
    f.kmt2a_mrg_subtype = mrgCount >= 2 ? "multi" : Number(asxl1 || 0) === 1 ? "ASXL1" : mrgOther === 1 ? "other_mrg" : "none";
    f.kmt2a_ras_mrg_combo = `${f.kmt2a_ras_subtype}__${f.kmt2a_mrg_subtype}`;
    f.kmt2a_age_x_kras = age === null ? null : age * kras0;
    f.kmt2a_age_x_tp53 = age === null ? null : age * tp53;
    f.kmt2a_log_wbc_x_ras = isMissing(f.log_wbc) ? null : Number(f.log_wbc) * rasAny;
    f.kmt2a_blast_burden_mean = blastBurden;
    f.kmt2a_blast_x_ras = blastBurden === null ? null : blastBurden * rasAny;

    return f;
  }

  function valueForColumn(features, column) {
    return Object.prototype.hasOwnProperty.call(features, column) ? features[column] : null;
  }

  function imputerFillValue(imputer, index) {
    if (imputer.strategy === "constant") return imputer.fill_value;
    if (Array.isArray(imputer.statistics)) return imputer.statistics[index];
    return null;
  }

  function transformSimpleImputer(imputer, values, numericMode) {
    const missing = values.map((value) => {
      if (numericMode) return toNumber(value) === null;
      return isMissing(value);
    });
    const transformed = values.map((value, index) => {
      if (missing[index]) {
        const fill = imputerFillValue(imputer, index);
        return numericMode ? Number(fill) : String(fill);
      }
      return numericMode ? Number(value) : String(value);
    });
    if (imputer.add_indicator && Array.isArray(imputer.indicator_features)) {
      imputer.indicator_features.forEach((featureIndex) => {
        transformed.push(missing[featureIndex] ? 1 : 0);
      });
    }
    return transformed;
  }

  function transformIterativeImputer(imputer, values) {
    const missing = values.map((value) => toNumber(value) === null);
    const transformed = values.map((value, index) => {
      const parsed = toNumber(value);
      return parsed === null ? Number(imputer.initial_statistics[index]) : parsed;
    });
    imputer.sequence.forEach((step) => {
      if (!missing[step.feat_idx]) return;
      const prediction =
        Number(step.estimator.intercept) +
        step.neighbor_feat_idx.reduce((total, featureIndex, coefIndex) => {
          return total + Number(step.estimator.coef[coefIndex]) * Number(transformed[featureIndex]);
        }, 0);
      const minValue = imputer.min_value ? imputer.min_value[step.feat_idx] : null;
      const maxValue = imputer.max_value ? imputer.max_value[step.feat_idx] : null;
      transformed[step.feat_idx] = Math.min(
        maxValue === null ? Infinity : Number(maxValue),
        Math.max(minValue === null ? -Infinity : Number(minValue), prediction),
      );
    });
    return transformed;
  }

  function applyScaler(scaler, values) {
    return values.map((value, index) => {
      const scale = Number(scaler.scale[index]) || 1;
      return (Number(value) - Number(scaler.mean[index])) / scale;
    });
  }

  function applyOneHot(onehot, values) {
    const out = [];
    values.forEach((value, index) => {
      const valueText = isMissing(value) ? "" : String(value);
      onehot.categories[index].forEach((category) => {
        out.push(valueText === String(category) ? 1 : 0);
      });
    });
    return out;
  }

  function transformPipeline(transformer, features) {
    const numericMode = Boolean(transformer.scaler) && !transformer.onehot;
    let values = transformer.columns.map((column) => valueForColumn(features, column));
    if (transformer.imputer) {
      if (transformer.imputer.type === "iterative") {
        values = transformIterativeImputer(transformer.imputer, values);
      } else {
        values = transformSimpleImputer(transformer.imputer, values, numericMode);
      }
    } else if (numericMode) {
      values = values.map((value) => Number(value));
    }
    if (transformer.onehot) values = applyOneHot(transformer.onehot, values);
    if (transformer.scaler) values = applyScaler(transformer.scaler, values);
    return values.map((value) => (Number.isFinite(Number(value)) ? Number(value) : 0));
  }

  function transformPreprocessor(preprocessor, features) {
    const out = [];
    preprocessor.transformers.forEach((transformer) => {
      out.push(...transformPipeline(transformer, features));
    });
    return out;
  }

  function dot(a, b) {
    let total = 0;
    for (let index = 0; index < a.length; index += 1) total += Number(a[index]) * Number(b[index]);
    return total;
  }

  function matVec(matrix, vector) {
    return matrix.map((row) => dot(row, vector));
  }

  function selectedValues(matrix, indices) {
    return indices.map((index) => matrix[index]);
  }

  function predictCore(endpointBundle, features) {
    const matrix = transformPreprocessor(endpointBundle.core.preprocessor, features);
    const values = selectedValues(matrix, endpointBundle.core.selected_indices);
    const contributions = values.map((value, index) => ({
      name: endpointBundle.core.selected_feature_names[index],
      value,
      coef: endpointBundle.core.coef[index],
      contribution: value * endpointBundle.core.coef[index],
    }));
    return {
      risk: dot(values, endpointBundle.core.coef) - Number(endpointBundle.core.offset || 0),
      matrix,
      values,
      contributions,
    };
  }

  function predictProxy(endpointBundle, features) {
    const matrix = transformPreprocessor(endpointBundle.proxy.preprocessor, features);
    const values = selectedValues(matrix, endpointBundle.proxy.selected_indices);
    const weights = endpointBundle.proxy.model.weights;
    const latent = weights["latent.weight"] ? matVec(weights["latent.weight"], values) : [];
    const auxWeight = weights["aux.weight"] || [];
    const auxBias = weights["aux.bias"] || [];
    const logits = auxWeight.map((row, index) => dot(row, latent) + Number(auxBias[index] || 0));
    const taskIndex = endpointBundle.proxy.model.task_names.indexOf("resp_c2_cr_cri");
    return {
      matrix,
      values,
      latent,
      respC2Proxy: taskIndex >= 0 ? logits[taskIndex] : null,
    };
  }

  function predictGate(endpointBundle, features, coreRisk, respC2Proxy) {
    const covariates = transformPreprocessor(endpointBundle.gate.cov_preprocessor, features);
    const riskZ = (coreRisk - endpointBundle.gate.risk_scaler.mean[0]) / (endpointBundle.gate.risk_scaler.scale[0] || 1);
    const proxyZ = (respC2Proxy - endpointBundle.gate.proxy_scaler.mean[0]) / (endpointBundle.gate.proxy_scaler.scale[0] || 1);
    const values = [riskZ, ...covariates.map((value) => value * proxyZ)];
    const contributions = values.map((value, index) => ({
      name: endpointBundle.gate.feature_names[index],
      value,
      coef: endpointBundle.gate.coef[index],
      contribution: value * endpointBundle.gate.coef[index],
    }));
    const finalRisk = dot(values, endpointBundle.gate.coef);
    return {
      risk: finalRisk,
      riskZ,
      proxyZ,
      coreComponent: contributions[0]?.contribution || 0,
      gateContribution: contributions.slice(1).reduce((total, item) => total + item.contribution, 0),
      contributions,
    };
  }

  function bisectRight(sorted, value) {
    let lo = 0;
    let hi = sorted.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (Number(sorted[mid]) <= value) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  function riskSummary(risk, distribution) {
    const percentile = distribution.sorted.length ? (bisectRight(distribution.sorted, risk) / distribution.sorted.length) * 100 : 0;
    let key = "low";
    if (risk > distribution.p67) {
      key = "high";
    } else if (risk > distribution.p33) {
      key = "mid";
    }
    return { percentile, key };
  }

  function predict(input, endpoint = "OS", model = "gate") {
    const endpointBundle = bundle.endpoints[endpoint];
    const features = deriveFeatures(input);
    const core = predictCore(endpointBundle, features);
    const proxy = predictProxy(endpointBundle, features);
    const gate = predictGate(endpointBundle, features, core.risk, proxy.respC2Proxy);
    const activeRisk = model === "core" ? core.risk : gate.risk;
    const distribution = model === "core" ? endpointBundle.core.risk_distribution : endpointBundle.gate.risk_distribution;
    const summary = riskSummary(activeRisk, distribution);
    const missingFields = bundle.input_schema.filter((field) => isMissing(input[field.key])).map((field) => field.key);
    return {
      endpoint,
      model,
      features,
      risk: activeRisk,
      distribution,
      summary,
      core,
      proxy,
      gate,
      missingFields,
      metrics: endpointBundle.metrics,
      nTrain: endpointBundle.n_train,
      events: endpointBundle.events,
    };
  }

  function fmt(value, digits = 3) {
    return Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : "--";
  }

  function fmtSigned(value, digits = 3) {
    if (!Number.isFinite(Number(value))) return "--";
    const rounded = Number(value).toFixed(digits);
    return Number(value) > 0 ? `+${rounded}` : rounded;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function text(key) {
    return I18N[state.lang][key] || I18N.zh[key] || key;
  }

  function fieldLabel(key, fallback = key) {
    return LABELS[state.lang].fields[key] || LABELS.zh.fields[key] || fallback;
  }

  function groupLabel(group) {
    return LABELS[state.lang].groups[group] || LABELS.zh.groups[group] || group;
  }

  function valueLabel(value) {
    if (value === "") return text("emptyOption");
    return LABELS[state.lang].values[value] || LABELS.zh.values[value] || value;
  }

  function unitLabel(field) {
    return LABELS[state.lang].units[field.key] || field.unit || "";
  }

  function riskGroupLabel(key) {
    return text(key === "high" ? "high" : key === "mid" ? "mid" : "low");
  }

  function modelName(model) {
    return model === "core" ? text("coreModel") : text("gateModel");
  }

  function stripFeaturePrefix(name) {
    return String(name)
      .replace(/^resp_c2_proxy_x_/, "")
      .replace(/^num__/, "")
      .replace(/^cat__/, "")
      .replace(/^missingindicator_/, state.lang === "zh" ? "缺失指示: " : "Missing indicator: ");
  }

  function splitRawAndLevel(name) {
    const stripped = stripFeaturePrefix(name);
    const candidates = Object.keys(LABELS.zh.fields).sort((a, b) => b.length - a.length);
    const raw = candidates.find((key) => stripped === key || stripped.startsWith(`${key}_`));
    if (!raw) return { raw: stripped, level: "" };
    const level = stripped === raw ? "" : stripped.slice(raw.length + 1);
    return { raw, level };
  }

  function prettyFeature(name) {
    const { raw, level } = splitRawAndLevel(name);
    const rawLabel = fieldLabel(raw, raw);
    if (!level) return rawLabel;
    return `${rawLabel}: ${valueLabel(level)}`;
  }

  function truncateLabel(label, maxLength = 28) {
    const text = String(label);
    return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
  }

  function topContributions(items, limit = 10) {
    return [...items]
      .filter((item) => Number.isFinite(item.contribution) && Math.abs(item.contribution) > 1e-12)
      .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
      .slice(0, limit);
  }

  function renderContributionChart(container, items) {
    const top = topContributions(items, 10);
    if (!top.length) {
      container.innerHTML = `<div class="empty-chart">${escapeHtml(text("noContribution"))}</div>`;
      return;
    }
    const rowHeight = 26;
    const width = 720;
    const labelWidth = 230;
    const centerX = 410;
    const barMax = 220;
    const height = 42 + rowHeight * top.length;
    const maxAbs = Math.max(...top.map((item) => Math.abs(item.contribution)), 1e-9);
    const rows = top
      .map((item, index) => {
        const y = 28 + index * rowHeight;
        const length = (Math.abs(item.contribution) / maxAbs) * barMax;
        const positive = item.contribution >= 0;
        const x = positive ? centerX : centerX - length;
        const color = positive ? "#9b4a36" : "#557a5d";
        return `
          <text class="svg-label" x="8" y="${y + 14}">${escapeHtml(truncateLabel(prettyFeature(item.name)))}</text>
          <rect x="${x}" y="${y}" width="${Math.max(2, length)}" height="16" rx="3" fill="${color}"></rect>
          <text class="svg-value" x="${positive ? x + length + 8 : x - 8}" y="${y + 13}" text-anchor="${positive ? "start" : "end"}">${fmtSigned(item.contribution)}</text>
        `;
      })
      .join("");
    container.innerHTML = `
      <svg width="100%" viewBox="0 0 ${width} ${height}" role="img" aria-label="变量贡献条形图">
        <line x1="${centerX}" x2="${centerX}" y1="18" y2="${height - 8}" stroke="#c8d0d8" stroke-width="1"></line>
        <text class="svg-label" x="${labelWidth}" y="14">${escapeHtml(text("lowerRisk"))}</text>
        <text class="svg-label" x="${centerX + 82}" y="14">${escapeHtml(text("higherRisk"))}</text>
        ${rows}
      </svg>
    `;
  }

  function renderWaterfall(container, prediction) {
    if (prediction.model === "core") {
      container.innerHTML = `<div class="empty-chart">${escapeHtml(text("coreOnlyWaterfall"))}</div>`;
      return;
    }
    const steps = [
      { label: text("coreRisk"), start: 0, end: prediction.gate.coreComponent, value: prediction.gate.coreComponent, color: "#19324a" },
      {
        label: text("adjustment"),
        start: prediction.gate.coreComponent,
        end: prediction.gate.coreComponent + prediction.gate.gateContribution,
        value: prediction.gate.gateContribution,
        color: prediction.gate.gateContribution >= 0 ? "#9b4a36" : "#557a5d",
      },
      { label: text("finalRisk"), start: 0, end: prediction.gate.risk, value: prediction.gate.risk, color: "#b88a38" },
    ];
    const width = 720;
    const height = 296;
    const plotTop = 28;
    const plotBottom = 208;
    const values = steps.flatMap((step) => [step.start, step.end, 0]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = Math.max((max - min) * 0.15, 0.2);
    const yScale = (value) => plotBottom - ((value - min + pad) / (max - min + pad * 2 || 1)) * (plotBottom - plotTop);
    const baseline = yScale(0);
    const barWidth = 92;
    const gap = 170;
    const startX = 110;
    const geometry = steps.map((step, index) => {
      const x = startX + index * gap;
      const yStart = yScale(step.start);
      const yEnd = yScale(step.end);
      const y = Math.min(yStart, yEnd);
      const h = Math.max(2, Math.abs(yEnd - yStart));
      return { ...step, x, yStart, yEnd, y, h };
    });
    const connectors = [
      [geometry[0].x + barWidth, geometry[0].yEnd, geometry[1].x, geometry[1].yStart],
      [geometry[1].x + barWidth, geometry[1].yEnd, geometry[2].x, geometry[2].yEnd],
    ]
      .map(
        ([x1, y1, x2, y2]) => `
          <path d="M ${x1} ${y1} L ${x2} ${y2}" fill="none" stroke="#9aa8b5" stroke-width="1.3" stroke-dasharray="4 4"></path>
        `,
      )
      .join("");
    const bars = steps
      .map((_, index) => {
        const step = geometry[index];
        const labelAbove = step.end >= step.start;
        const valueY = labelAbove ? Math.max(16, step.y - 8) : Math.min(232, step.y + step.h + 16);
        return `
          <rect x="${step.x}" y="${step.y}" width="${barWidth}" height="${step.h}" rx="5" fill="${step.color}"></rect>
          <text class="svg-value" x="${step.x + barWidth / 2}" y="${valueY}" text-anchor="middle">${fmtSigned(step.value)}</text>
          <text class="svg-label" x="${step.x + barWidth / 2}" y="258" text-anchor="middle">${escapeHtml(step.label)}</text>
        `;
      })
      .join("");
    container.innerHTML = `
      <svg width="100%" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(text("waterfallTitle"))}">
        <line x1="72" x2="650" y1="${baseline}" y2="${baseline}" stroke="#aeb8c2" stroke-width="1"></line>
        <text class="svg-label" x="36" y="${baseline + 4}" text-anchor="middle">0</text>
        ${connectors}
        ${bars}
      </svg>
    `;
  }

  function renderGateTerms(container, prediction) {
    if (prediction.model === "core") {
      container.innerHTML = `<div class="empty-chart">${escapeHtml(text("coreOnlyTerms"))}</div>`;
      return;
    }
    const terms = topContributions(prediction.gate.contributions.slice(1), 9);
    if (!terms.length) {
      container.innerHTML = `<div class="empty-chart">${escapeHtml(text("noTerms"))}</div>`;
      return;
    }
    container.innerHTML = terms
      .map(
        (item) => `
          <div class="term-row">
            <div class="term-name">${escapeHtml(prettyFeature(item.name))}</div>
            <div class="term-value">${fmtSigned(item.contribution)}</div>
          </div>
        `,
      )
      .join("");
  }

  function renderMetricTable(table, predictions) {
    const rows = ["OS", "RFS"].flatMap((endpoint) => {
      const prediction = predictions[endpoint];
      return [
        { endpoint, model: "core", metrics: prediction.metrics.core, nTrain: prediction.nTrain, events: prediction.events },
        { endpoint, model: "gate", metrics: prediction.metrics.gate, nTrain: prediction.nTrain, events: prediction.events },
      ];
    });
    table.innerHTML = `
      <thead>
        <tr>
          <th>${escapeHtml(text("endpoint"))}</th>
          <th>${escapeHtml(text("model"))}</th>
          <th>${escapeHtml(text("nEvents"))}</th>
          <th>${escapeHtml(text("cIndex"))}</th>
          <th>${escapeHtml(text("correctedCIndex"))}</th>
          <th>${escapeHtml(text("auc1"))}</th>
          <th>${escapeHtml(text("auc2"))}</th>
          <th>${escapeHtml(text("auc3"))}</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
            <tr class="${row.model === state.model ? "is-active-model" : ""}">
              <td>${escapeHtml(row.endpoint)}</td>
              <td>${escapeHtml(modelName(row.model))}</td>
              <td>${row.nTrain}/${row.events}</td>
              <td>${fmt(row.metrics.c_index)}</td>
              <td>${fmt(row.metrics.corrected_c_index)}</td>
              <td>${fmt(row.metrics.auc_1y)}</td>
              <td>${fmt(row.metrics.auc_2y)}</td>
              <td>${fmt(row.metrics.auc_3y)}</td>
            </tr>
          `,
          )
          .join("")}
      </tbody>
      <caption>${escapeHtml(text("tableNote"))}</caption>
    `;
  }

  function optionLabel(option) {
    return valueLabel(option);
  }

  function renderField(field) {
    const id = `field_${field.key}`;
    let control = "";
    if (field.type === "number") {
      control = `<input id="${id}" data-field="${field.key}" type="number" step="any" placeholder="${escapeHtml(text("placeholder"))}" />`;
    } else {
      let options = field.options || ["", "Y", "N"];
      if (field.type === "binary") options = ["", "1", "0"];
      if (field.type === "yn") options = ["", "Y", "N"];
      control = `
        <select id="${id}" data-field="${field.key}">
          ${options.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(optionLabel(option))}</option>`).join("")}
        </select>
      `;
    }
    return `
      <div class="field">
        <label for="${id}">${escapeHtml(fieldLabel(field.key, field.label))}</label>
        <div class="control-wrap">${control}</div>
        ${unitLabel(field) ? `<span class="unit">${escapeHtml(unitLabel(field))}</span>` : ""}
      </div>
    `;
  }

  function renderForm() {
    const form = document.getElementById("inputForm");
    const groups = new Map();
    bundle.input_schema.forEach((field) => {
      if (!groups.has(field.group)) groups.set(field.group, []);
      groups.get(field.group).push(field);
    });
    form.innerHTML = [...groups.entries()]
      .map(
        ([group, fields]) => `
          <section class="form-section">
            <h2>${escapeHtml(groupLabel(group))}</h2>
            <div class="field-grid">${fields.map(renderField).join("")}</div>
          </section>
        `,
      )
      .join("");
    form.querySelectorAll("[data-field]").forEach((control) => {
      control.addEventListener("input", update);
      control.addEventListener("change", update);
    });
  }

  function readInput() {
    const input = {};
    document.querySelectorAll("[data-field]").forEach((control) => {
      input[control.dataset.field] = control.value;
    });
    return input;
  }

  function setInputValues(values) {
    document.querySelectorAll("[data-field]").forEach((control) => {
      const key = control.dataset.field;
      const value = values[key];
      control.value = isMissing(value) ? "" : String(value);
    });
    update();
  }

  function endpointTitle(endpoint) {
    return endpoint === "OS" ? text("osTitle") : text("rfsTitle");
  }

  function phrase(key, ...args) {
    const value = I18N[state.lang][key] || I18N.zh[key] || key;
    return typeof value === "function" ? value(...args) : value;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function renderEndpointResults(predictions) {
    const container = document.getElementById("endpointResults");
    container.innerHTML = ["OS", "RFS"]
      .map((endpoint) => {
        const prediction = predictions[endpoint];
        const marker = clamp(prediction.summary.percentile, 0, 100);
        const responseScore = prediction.model === "gate" ? fmt(prediction.proxy.respC2Proxy, 4) : text("notUsed");
        const adjustment = prediction.model === "gate" ? fmtSigned(prediction.gate.gateContribution, 4) : text("notUsed");
        return `
          <section class="endpoint-result-card ${prediction.summary.key}">
            <div class="endpoint-card-header">
              <h2>${escapeHtml(endpointTitle(endpoint))}</h2>
              <span>${escapeHtml(modelName(prediction.model))}</span>
            </div>
            <div class="score-grid">
              <div class="score-tile">
                <span>${escapeHtml(text("relativeRisk"))}</span>
                <strong>${fmt(prediction.risk, 4)}</strong>
              </div>
              <div class="score-tile">
                <span>${escapeHtml(text("percentile"))}</span>
                <strong>${fmt(prediction.summary.percentile, 1)}%</strong>
              </div>
              <div class="score-tile group">
                <span>${escapeHtml(text("riskGroup"))}</span>
                <strong>${escapeHtml(riskGroupLabel(prediction.summary.key))}</strong>
              </div>
            </div>
            <div class="risk-meter" aria-label="${escapeHtml(text("percentile"))}">
              <div class="meter-track">
                <span class="meter-band low"></span>
                <span class="meter-band mid"></span>
                <span class="meter-band high"></span>
                <span class="meter-marker" style="left:${marker}%"></span>
              </div>
              <div class="meter-labels">
                <span>${escapeHtml(text("low"))}</span>
                <span>${escapeHtml(text("mid"))}</span>
                <span>${escapeHtml(text("high"))}</span>
              </div>
            </div>
            <div class="component-grid">
              <div>
                <span>${escapeHtml(text("coreRisk"))}</span>
                <strong>${fmt(prediction.core.risk, 4)}</strong>
              </div>
              <div>
                <span>${escapeHtml(text("responseScore"))}</span>
                <strong>${escapeHtml(responseScore)}</strong>
              </div>
              <div>
                <span>${escapeHtml(text("adjustment"))}</span>
                <strong>${escapeHtml(adjustment)}</strong>
              </div>
            </div>
          </section>
        `;
      })
      .join("");
  }

  function smoothPath(points) {
    if (!points.length) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let index = 1; index < points.length - 1; index += 1) {
      const midX = (points[index].x + points[index + 1].x) / 2;
      const midY = (points[index].y + points[index + 1].y) / 2;
      d += ` Q ${points[index].x} ${points[index].y} ${midX} ${midY}`;
    }
    const last = points[points.length - 1];
    d += ` L ${last.x} ${last.y}`;
    return d;
  }

  function quantileSorted(values, q) {
    if (!values.length) return 0;
    const position = (values.length - 1) * q;
    const lower = Math.floor(position);
    const upper = Math.ceil(position);
    const weight = position - lower;
    return Number(values[lower]) * (1 - weight) + Number(values[upper]) * weight;
  }

  function standardDeviation(values) {
    if (values.length < 2) return 0;
    const mean = values.reduce((total, value) => total + Number(value), 0) / values.length;
    const variance = values.reduce((total, value) => total + (Number(value) - mean) ** 2, 0) / (values.length - 1);
    return Math.sqrt(Math.max(variance, 0));
  }

  function makeAdaptiveDensity(sorted, min, max) {
    const range = max - min || 1;
    const iqr = quantileSorted(sorted, 0.75) - quantileSorted(sorted, 0.25);
    const sdValue = standardDeviation(sorted);
    const robustScale = Math.min(sdValue || range / 6, iqr > 0 ? iqr / 1.34 : sdValue || range / 6);
    const baseBandwidth = Math.max(0.9 * robustScale * Math.pow(sorted.length, -0.2), range / 300, 1e-6);
    const pilotAt = (x) =>
      sorted.reduce((total, value) => {
        const z = (x - value) / baseBandwidth;
        return total + Math.exp(-0.5 * z * z);
      }, 0) /
      (sorted.length * baseBandwidth);
    const pilot = sorted.map(pilotAt);
    const floor = 1e-12;
    const geometricMean = Math.exp(pilot.reduce((total, value) => total + Math.log(Math.max(value, floor)), 0) / pilot.length);
    const alpha = 0.75;
    const bandwidths = pilot.map((value) => {
      const adaptive = baseBandwidth * Math.pow(geometricMean / Math.max(value, floor), alpha);
      return clamp(adaptive, baseBandwidth * 0.12, baseBandwidth * 6);
    });
    return (x) =>
      sorted.reduce((total, value, index) => {
        const bandwidth = bandwidths[index];
        const z = (x - value) / bandwidth;
        return total + Math.exp(-0.5 * z * z) / bandwidth;
      }, 0);
  }

  function interpolateCurveY(points, x) {
    if (!points.length) return 0;
    if (x <= points[0].x) return points[0].y;
    for (let index = 0; index < points.length - 1; index += 1) {
      const left = points[index];
      const right = points[index + 1];
      if (x <= right.x) {
        const ratio = (x - left.x) / (right.x - left.x || 1);
        return left.y + ratio * (right.y - left.y);
      }
    }
    return points[points.length - 1].y;
  }

  function renderRiskDistribution(container, prediction) {
    const sorted = prediction.distribution.sorted.map(Number).filter(Number.isFinite);
    if (!sorted.length) {
      container.innerHTML = `<div class="empty-chart">${escapeHtml(text("noContribution"))}</div>`;
      return;
    }
    const width = 720;
    const height = 280;
    const plotLeft = 54;
    const plotRight = 670;
    const plotTop = 34;
    const plotBottom = 212;
    const values = [sorted[0], sorted[sorted.length - 1], prediction.risk, prediction.distribution.p33, prediction.distribution.p67];
    let min = Math.min(...values);
    let max = Math.max(...values);
    const range = max - min || 1;
    min -= range * 0.08;
    max += range * 0.08;
    const xScale = (value) => plotLeft + ((value - min) / (max - min || 1)) * (plotRight - plotLeft);
    const densityAt = makeAdaptiveDensity(sorted, min, max);
    const densityPoints = 120;
    const density = Array.from({ length: densityPoints }, (_, index) => {
      const xValue = min + (index / (densityPoints - 1)) * (max - min);
      const yValue = densityAt(xValue);
      return { xValue, yValue };
    });
    const maxDensity = Math.max(...density.map((point) => point.yValue), 1);
    const points = density.map((point) => ({
      x: xScale(point.xValue),
      y: plotBottom - (point.yValue / maxDensity) * (plotBottom - plotTop),
    }));
    const curvePath = smoothPath(points);
    const areaPath = `${curvePath} L ${plotRight} ${plotBottom} L ${plotLeft} ${plotBottom} Z`;
    const p33x = xScale(prediction.distribution.p33);
    const p67x = xScale(prediction.distribution.p67);
    const patientX = xScale(prediction.risk);
    const patientY = interpolateCurveY(points, patientX);
    const patientLabelX = clamp(patientX, plotLeft + 64, plotRight - 64);
    const patientLineColor = prediction.summary.key === "high" ? "#9b4a36" : prediction.summary.key === "mid" ? "#b88a38" : "#557a5d";
    const glowId = `riskGlow-${prediction.endpoint}-${prediction.model}`;
    const areaClipId = `riskAreaClip-${prediction.endpoint}-${prediction.model}`;
    const lowWidth = Math.max(0, p33x - plotLeft);
    const midWidth = Math.max(0, p67x - p33x);
    const highWidth = Math.max(0, plotRight - p67x);
    const bandY = plotBottom + 18;
    const zoneLabelY = plotBottom + 42;
    container.innerHTML = `
      <svg width="100%" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(text("distributionAria"))}">
        <defs>
          <filter id="${glowId}" x="-20%" y="-30%" width="140%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur"></feGaussianBlur>
            <feMerge>
              <feMergeNode in="blur"></feMergeNode>
              <feMergeNode in="SourceGraphic"></feMergeNode>
            </feMerge>
          </filter>
          <clipPath id="${areaClipId}">
            <path d="${areaPath}"></path>
          </clipPath>
        </defs>
        <rect x="${plotLeft}" y="${plotTop}" width="${plotRight - plotLeft}" height="${plotBottom - plotTop}" fill="#ffffff" opacity="0.58"></rect>
        <text class="svg-zone-label low" x="${plotLeft + lowWidth / 2}" y="${zoneLabelY}" text-anchor="middle">${escapeHtml(text("low"))}</text>
        <text class="svg-zone-label mid" x="${p33x + midWidth / 2}" y="${zoneLabelY}" text-anchor="middle">${escapeHtml(text("mid"))}</text>
        <text class="svg-zone-label high" x="${p67x + highWidth / 2}" y="${zoneLabelY}" text-anchor="middle">${escapeHtml(text("high"))}</text>
        <rect x="${plotLeft}" y="${plotTop}" width="${plotRight - plotLeft}" height="${plotBottom - plotTop}" fill="none" stroke="#8d99a6" stroke-width="1.2"></rect>
        <line x1="${plotLeft}" x2="${plotRight}" y1="${plotTop + (plotBottom - plotTop) / 2}" y2="${plotTop + (plotBottom - plotTop) / 2}" stroke="#d9dee4" stroke-width="1"></line>
        <line x1="${plotLeft + (plotRight - plotLeft) / 4}" x2="${plotLeft + (plotRight - plotLeft) / 4}" y1="${plotTop}" y2="${plotBottom}" stroke="#e2e6ea" stroke-width="1"></line>
        <line x1="${plotLeft + ((plotRight - plotLeft) * 2) / 4}" x2="${plotLeft + ((plotRight - plotLeft) * 2) / 4}" y1="${plotTop}" y2="${plotBottom}" stroke="#e2e6ea" stroke-width="1"></line>
        <line x1="${plotLeft + ((plotRight - plotLeft) * 3) / 4}" x2="${plotLeft + ((plotRight - plotLeft) * 3) / 4}" y1="${plotTop}" y2="${plotBottom}" stroke="#e2e6ea" stroke-width="1"></line>
        <line x1="${plotLeft}" x2="${plotLeft - 6}" y1="${plotTop}" y2="${plotTop}" stroke="#8d99a6" stroke-width="1.2"></line>
        <line x1="${plotLeft}" x2="${plotLeft - 6}" y1="${plotTop + (plotBottom - plotTop) / 2}" y2="${plotTop + (plotBottom - plotTop) / 2}" stroke="#8d99a6" stroke-width="1.2"></line>
        <line x1="${plotLeft}" x2="${plotLeft - 6}" y1="${plotBottom}" y2="${plotBottom}" stroke="#8d99a6" stroke-width="1.2"></line>
        <line x1="${plotLeft}" x2="${plotLeft}" y1="${plotBottom}" y2="${plotBottom + 6}" stroke="#8d99a6" stroke-width="1.2"></line>
        <line x1="${plotRight}" x2="${plotRight}" y1="${plotBottom}" y2="${plotBottom + 6}" stroke="#8d99a6" stroke-width="1.2"></line>
        <g class="distribution-area-segments" clip-path="url(#${areaClipId})">
          <rect x="${plotLeft}" y="${plotTop}" width="${lowWidth}" height="${plotBottom - plotTop}" fill="#2f8f63" opacity="0.28"></rect>
          <rect x="${p33x}" y="${plotTop}" width="${midWidth}" height="${plotBottom - plotTop}" fill="#d9a21b" opacity="0.28"></rect>
          <rect x="${p67x}" y="${plotTop}" width="${highWidth}" height="${plotBottom - plotTop}" fill="#c84d3d" opacity="0.25"></rect>
        </g>
        <path class="distribution-curve-shadow" d="${curvePath}" fill="none" stroke="#244863" stroke-width="3" stroke-linecap="round" opacity="0.1"></path>
        <path class="distribution-curve" d="${curvePath}" pathLength="1" fill="none" stroke="#0f3149" stroke-width="1.8" stroke-linecap="round" filter="url(#${glowId})"></path>
        <line class="cutoff-line" x1="${p33x}" x2="${p33x}" y1="${plotTop}" y2="${plotBottom}" stroke="#2e3640" stroke-width="2" stroke-dasharray="8 8"></line>
        <line class="cutoff-line" x1="${p67x}" x2="${p67x}" y1="${plotTop}" y2="${plotBottom}" stroke="#2e3640" stroke-width="2" stroke-dasharray="8 8"></line>
        <line class="patient-line" x1="${patientX}" x2="${patientX}" y1="${patientY}" y2="${plotBottom}" stroke="${patientLineColor}" stroke-width="3"></line>
        <circle cx="${patientX}" cy="${patientY}" r="5.5" fill="${patientLineColor}" stroke="#ffffff" stroke-width="2"></circle>
        <path d="M ${patientX - 8} ${patientY + 11} L ${patientX + 8} ${patientY + 11} L ${patientX} ${patientY + 22} Z" fill="${patientLineColor}"></path>
        <text class="svg-value" x="${patientLabelX}" y="20" text-anchor="middle">${escapeHtml(text("currentPatient"))}: ${fmt(prediction.risk, 3)}</text>
        <rect x="${plotLeft}" y="${bandY}" width="${lowWidth}" height="8" rx="4" fill="#2f8f63" opacity="0.82"></rect>
        <rect x="${p33x}" y="${bandY}" width="${midWidth}" height="8" rx="4" fill="#d9a21b" opacity="0.86"></rect>
        <rect x="${p67x}" y="${bandY}" width="${highWidth}" height="8" rx="4" fill="#c84d3d" opacity="0.82"></rect>
        <text class="svg-label" x="${plotLeft}" y="${plotBottom + 64}" text-anchor="start">${fmt(min, 2)}</text>
        <text class="svg-label" x="${plotRight}" y="${plotBottom + 64}" text-anchor="end">${fmt(max, 2)}</text>
        <g class="hover-layer" opacity="0">
          <line class="hover-guide" x1="${plotLeft}" x2="${plotLeft}" y1="${plotTop}" y2="${plotBottom}"></line>
          <circle class="hover-dot" cx="${plotLeft}" cy="${plotBottom}" r="5.5"></circle>
          <g class="hover-readout" transform="translate(${plotLeft + 8}, ${plotTop + 36})">
            <text class="svg-value" data-hover-risk x="0" y="0"></text>
            <text class="svg-label" data-hover-percentile x="0" y="17"></text>
            <text class="svg-label" data-hover-group x="0" y="34"></text>
          </g>
        </g>
        <rect class="interaction-capture" x="${plotLeft}" y="${plotTop}" width="${plotRight - plotLeft}" height="${plotBottom - plotTop}" fill="transparent"></rect>
      </svg>
    `;
    const svg = container.querySelector("svg");
    const capture = svg?.querySelector(".interaction-capture");
    const hoverLayer = svg?.querySelector(".hover-layer");
    const hoverGuide = svg?.querySelector(".hover-guide");
    const hoverDot = svg?.querySelector(".hover-dot");
    const hoverReadout = svg?.querySelector(".hover-readout");
    const hoverRisk = svg?.querySelector("[data-hover-risk]");
    const hoverPercentile = svg?.querySelector("[data-hover-percentile]");
    const hoverGroup = svg?.querySelector("[data-hover-group]");
    if (!svg || !capture || !hoverLayer || !hoverGuide || !hoverDot || !hoverReadout || !hoverRisk || !hoverPercentile || !hoverGroup) return;
    const riskFromX = (x) => min + ((x - plotLeft) / (plotRight - plotLeft || 1)) * (max - min);
    const updateHover = (event) => {
      const rect = svg.getBoundingClientRect();
      const x = clamp((event.clientX - rect.left) * (width / (rect.width || width)), plotLeft, plotRight);
      const risk = riskFromX(x);
      const summary = riskSummary(risk, prediction.distribution);
      const y = interpolateCurveY(points, x);
      const color = summary.key === "high" ? "#9b4a36" : summary.key === "mid" ? "#b88a38" : "#557a5d";
      const readoutX = x > plotRight - 230 ? x - 222 : x + 14;
      hoverLayer.setAttribute("opacity", "1");
      hoverGuide.setAttribute("x1", x);
      hoverGuide.setAttribute("x2", x);
      hoverGuide.setAttribute("stroke", color);
      hoverDot.setAttribute("cx", x);
      hoverDot.setAttribute("cy", y);
      hoverDot.setAttribute("fill", color);
      hoverReadout.setAttribute("transform", `translate(${readoutX}, ${plotTop + 36})`);
      hoverRisk.textContent = `${text("hoverRisk")}: ${fmt(risk, 3)}`;
      hoverPercentile.textContent = `${text("hoverPercentile")}: ${fmt(summary.percentile, 1)}%`;
      hoverGroup.textContent = `${text("hoverGroup")}: ${riskGroupLabel(summary.key)}`;
    };
    capture.addEventListener("mouseenter", updateHover);
    capture.addEventListener("mousemove", updateHover);
    capture.addEventListener("mouseleave", () => hoverLayer.setAttribute("opacity", "0"));
  }

  function renderEndpointChartGrid(containerId, predictions, renderer, boxClass = "chart-box") {
    const container = document.getElementById(containerId);
    container.innerHTML = ["OS", "RFS"]
      .map(
        (endpoint) => `
          <section class="endpoint-chart-card">
            <h3>${escapeHtml(endpointTitle(endpoint))}</h3>
            <div class="${boxClass}" data-endpoint-chart="${containerId}-${endpoint}"></div>
          </section>
        `,
      )
      .join("");
    ["OS", "RFS"].forEach((endpoint) => {
      const target = container.querySelector(`[data-endpoint-chart="${containerId}-${endpoint}"]`);
      renderer(target, predictions[endpoint]);
    });
  }

  function renderMissingNote(prediction) {
    const missingNote = document.getElementById("missingNote");
    if (!prediction.missingFields.length) {
      missingNote.textContent = "";
      return;
    }
    const labels = prediction.missingFields.map((key) => fieldLabel(key, key));
    const separator = state.lang === "zh" ? "、" : ", ";
    const shown = labels.slice(0, 7).join(separator);
    const tail = labels.length > 7 ? `${separator}${phrase("missingTail", labels.length)}` : "";
    missingNote.textContent = `${phrase("missingPrefix")}${shown}${tail}${state.lang === "zh" ? "。" : "."}`;
  }

  function renderAllPredictions(predictions) {
    renderEndpointResults(predictions);
    renderEndpointChartGrid("distributionGrid", predictions, renderRiskDistribution);
    renderEndpointChartGrid("waterfallGrid", predictions, renderWaterfall);
    renderEndpointChartGrid("contributionGrid", predictions, (target, prediction) => {
      renderContributionChart(target, prediction.core.contributions);
    });
    renderEndpointChartGrid("correctionGrid", predictions, renderGateTerms, "term-list");
    renderMetricTable(document.getElementById("metricTable"), predictions);
    renderMissingNote(predictions.OS);
  }

  function applyStaticText() {
    document.documentElement.lang = text("htmlLang");
    document.title = text("docTitle");
    const textTargets = {
      pageTitle: "title",
      pageSubtitle: "subtitle",
      researchUseNote: "researchUse",
      modelControlLabel: "modelControl",
      coreModelButton: "coreModel",
      gateModelButton: "gateModel",
      exampleButton: "example",
      clearButton: "clear",
      resultNote: "resultNote",
      distributionTitle: "distributionTitle",
      distributionCaption: "distributionCaption",
      waterfallTitle: "waterfallTitle",
      waterfallCaption: "waterfallCaption",
      contributionTitle: "contributionTitle",
      contributionCaption: "contributionCaption",
      correctionTitle: "correctionTitle",
      correctionCaption: "correctionCaption",
      metricTitle: "metricTitle",
      metricCaption: "metricCaption",
    };
    Object.entries(textTargets).forEach(([id, key]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = text(key);
    });
    document.querySelectorAll("[data-lang]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.lang === state.lang);
    });
    document.querySelectorAll("[data-model]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.model === state.model);
    });
  }

  function update() {
    const input = readInput();
    try {
      const predictions = {
        OS: predict(input, "OS", state.model),
        RFS: predict(input, "RFS", state.model),
      };
      renderAllPredictions(predictions);
    } catch (error) {
      console.error(error);
      document.getElementById("endpointResults").innerHTML = `<div class="empty-chart">${escapeHtml(text("error"))}</div>`;
      document.getElementById("missingNote").textContent = phrase("inferenceError", error.message);
    }
  }

  function bindControls() {
    document.querySelectorAll("[data-lang]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.dataset.lang === state.lang) return;
        const current = readInput();
        state.lang = button.dataset.lang;
        applyStaticText();
        renderForm();
        setInputValues(current);
      });
    });
    document.querySelectorAll("[data-model]").forEach((button) => {
      button.addEventListener("click", () => {
        state.model = button.dataset.model;
        document.querySelectorAll("[data-model]").forEach((item) => item.classList.toggle("is-active", item === button));
        update();
      });
    });
    document.getElementById("clearButton").addEventListener("click", () => setInputValues({}));
    document.getElementById("exampleButton").addEventListener("click", () => {
      setInputValues(SYNTHETIC_EXAMPLE_INPUT);
    });
  }

  function init() {
    applyStaticText();
    renderForm();
    bindControls();
    update();
  }

  root.AMLCalculator = {
    predict,
    deriveFeatures,
    transformPreprocessor,
    bundle,
  };

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }
})(typeof window !== "undefined" ? window : globalThis);
