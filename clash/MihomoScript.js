function main(config) {
  // ====================
  // 0. 手动维护的直连域名 (根据实际情况自行添加)
  // ====================
  const bypassDomains = [
    "example.com", "none.com"
  ];

  // ====================
  // 1. 常量配置
  // ====================
  const SETTINGS = {
    ICON_BASE: "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/",
    RULE_BASE: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/",
    TEST_URL: "https://www.gstatic.com/generate_204",

    REGION_ORDER: ["HK", "TW", "SG", "JP", "KR", "AS", "US"],

    URL_TEST_EXTRA: {
      hidden: true,
      url: "https://www.gstatic.com/generate_204",
      interval: 900,
      tolerance: 50,
      lazy: true,
      timeout: 3000
    },

    FALLBACK_EXTRA: {
      hidden: true,
      url: "https://www.gstatic.com/generate_204",
      interval: 900,
      tolerance: 50,
      lazy: true,
      timeout: 3000
    },

    FILTER_REGEX: /群|邀请|返利|官网|官方|网址|订阅|购买|续费|剩余|到期|过期|流量|备用|邮箱|客服|联系|工单|倒卖|防止|梯子|tg|telegram|电报|发布|重置/i,

    BASIC_FAKE_IP_FILTER: [
      "*.lan", "+.lan", "*.local", "+.local", "+.localdomain", "+.home.arpa",
      "+.msftconnecttest.com", "+.msftncsi.com", "+.gstatic.com", "connectivitycheck.gstatic.com", "+.captive.apple.com",
      "time.*.com", "time.*.gov", "ntp.*.com", "ntp.*.org", "pool.ntp.org", "+.pool.ntp.org",
      "+.stun.*.*", "+.stun.*.*.*", "+.stun.*.*.*.*",
      "localhost.ptlogin2.qq.com", "WORKGROUP"
    ],

    FORCE_DOMAIN: [
      "+.openai.com", "+.chat.com", "+.chatgpt.com", "+.oaistatic.com", "+.oaiusercontent.com", "+.sora.com",
      "+.anthropic.com", "+.claude.ai", "+.claude.com", "+.claudeusercontent.com",
      "+.gemini.google.com", "+.aistudio.google.com", "+.generativelanguage.googleapis.com", "+.makersuite.google.com", "+.notebooklm.google.com"
    ],

    DIRECT_FIX_RULES: [
      "DOMAIN-SUFFIX,ol.epicgames.com,DIRECT",
      "DOMAIN-SUFFIX,dizhensubao.getui.com,DIRECT",
      "DOMAIN-SUFFIX,tracking-protection.cdn.mozilla.net,DIRECT",
      "DOMAIN,origin-a.akamaihd.net,DIRECT",
      "DOMAIN,fairplay.l.qq.com,DIRECT",
      "DOMAIN,livew.l.qq.com,DIRECT",
      "DOMAIN,vd.l.qq.com,DIRECT",
      "DOMAIN,errlog.umeng.com,DIRECT",
      "DOMAIN,msg.umeng.com,DIRECT",
      "DOMAIN,msg.umengcloud.com,DIRECT",
      "DOMAIN,tracking.miui.com,DIRECT",
      "DOMAIN,app.adjust.com,DIRECT",
      "DOMAIN,bdtj.tagtic.cn,DIRECT",
      "DOMAIN,rewards.hypixel.net,DIRECT",
      "DOMAIN-SUFFIX,koodomobile.com,DIRECT",
      "DOMAIN-SUFFIX,koodomobile.ca,DIRECT"
    ]
  };

  // ====================
  // 2. 基础工具
  // ====================
  const uniq = (arr = []) => [...new Set(arr.filter(Boolean))];
  const escapeRegex = (s = "") => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // 统一节点名格式，方便识别地区、国旗和常见缩写
  const normalizeName = (name = "") => String(name)
    .replace(/(IEPL|IPLC|BGP|RELAY|PRO|V\d+)/ig, " $1 ")
    .replace(/[【】\[\]（）()|_\-.,/:~]/g, " ")
    .replace(/🇭🇰/g, " HK ")
    .replace(/🇹🇼/g, " TW ")
    .replace(/🇸🇬/g, " SG ")
    .replace(/🇯🇵/g, " JP ")
    .replace(/🇰🇷/g, " KR ")
    .replace(/🇻🇳|🇹🇭|🇲🇾|🇮🇩|🇵🇭/g, " AS ")
    .replace(/🇺🇸/g, " US ")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();

  const buildRegex = (arr = []) => {
    const patterns = arr.map((raw) => {
      const token = String(raw).trim().toUpperCase();
      const escaped = escapeRegex(token);
      if (/^[A-Z]{2,3}$/.test(token)) {
        return `(?:^|[^A-Z])${escaped}(?:[^A-Z]|$)`;
      }
      return escaped;
    });
    return new RegExp(patterns.join("|"), "i");
  };

  const buildRegions = () => ([
    { name: "HK", pattern: ["香港", "HK", "HKG", "HONGKONG", "HONG KONG"], icon: "Hong_Kong.png" },
    { name: "TW", pattern: ["台湾", "台北", "新北", "TW", "TWN", "TAIWAN", "TAIPEI", "TPE"], icon: "Taiwan.png" },
    { name: "SG", pattern: ["新加坡", "狮城", "SG", "SGP", "SINGAPORE", "SIN"], icon: "Singapore.png" },
    { name: "JP", pattern: ["日本", "东京", "大阪", "JP", "JPN", "JAPAN", "TOKYO", "OSAKA", "NRT", "HND", "TYO"], icon: "Japan.png" },
    { name: "KR", pattern: ["韩国", "首尔", "KR", "KOR", "KOREA", "SEOUL", "ICN"], icon: "Korea.png" },
    {
      name: "AS",
      pattern: [
        "越南", "泰国", "马来西亚", "印尼", "菲律宾",
        "VN", "TH", "MY", "ID", "PH",
        "VIETNAM", "THAILAND", "MALAYSIA", "INDONESIA", "PHILIPPINES", "MANILA"
      ],
      icon: "Available.png"
    },
    {
      name: "US",
      pattern: [
        "美国", "纽约", "洛杉矶", "旧金山", "圣何塞", "西雅图", "芝加哥", "达拉斯", "硅谷",
        "US", "USA",
        "UNITEDSTATES", "UNITED STATES",
        "NEWYORK", "NEW YORK",
        "LOSANGELES", "LOS ANGELES",
        "SANFRANCISCO", "SAN FRANCISCO",
        "SANJOSE", "SAN JOSE",
        "SEATTLE", "CHICAGO", "DALLAS", "LAX", "SJC", "SFO"
      ],
      icon: "United_States.png"
    }
  ]).map((r) => ({ ...r, regex: buildRegex(r.pattern) }));

  const REGIONS = buildRegions();

  // ====================
  // 3. 节点处理
  // ====================
  const ensureConfigObject = (input) => (input && typeof input === "object" ? input : {});
  const getOriginalProxies = (input) => Array.isArray(input.proxies) ? input.proxies : [];

  const makeProxyNamesUnique = (proxies = []) => {
    const used = new Set();
    const nextIdx = new Map();

    proxies.forEach((p) => {
      if (!p?.name) return;
      const base = String(p.name);
      if (!used.has(base)) {
        used.add(base);
        nextIdx.set(base, 1);
        return;
      }
      let idx = nextIdx.get(base) ?? 1;
      let candidate = `${base}_${idx}`;
      while (used.has(candidate)) {
        idx += 1;
        candidate = `${base}_${idx}`;
      }
      p.name = candidate;
      used.add(candidate);
      nextIdx.set(base, idx + 1);
    });
  };

  const splitInfoAndNormalProxies = (proxies = [], filterRegex) => {
    const infoProxies = [];
    const normalProxies = [];

    proxies.forEach((proxy) => {
      if (!proxy?.name) return;
      if (filterRegex.test(proxy.name)) {
        infoProxies.push(proxy);
      } else {
        normalProxies.push(proxy);
      }
    });

    return { infoProxies, normalProxies };
  };

  // 节点会分为 HK / TW / SG / JP / KR / AS / US / Other
  const classifyProxiesByRegion = (normalProxies = [], regions = []) => {
    const regionGroupsData = regions.map((r) => ({ name: r.name, icon: r.icon, proxies: [] }));
    const regionGroupMap = new Map(regionGroupsData.map((r) => [r.name, r]));
    const regionSeen = new Map(regionGroupsData.map((r) => [r.name, new Set()]));
    const otherProxyNames = [];
    const otherSeen = new Set();

    normalProxies.forEach((proxy) => {
      const proxyName = proxy.name;
      const normName = normalizeName(proxyName);
      const matchedRegion = regions.find((r) => r.regex.test(normName));

      if (matchedRegion) {
        const group = regionGroupMap.get(matchedRegion.name);
        const seen = regionSeen.get(matchedRegion.name);
        if (group && seen && !seen.has(proxyName)) {
          group.proxies.push(proxyName);
          seen.add(proxyName);
        }
      } else if (!otherSeen.has(proxyName)) {
        otherProxyNames.push(proxyName);
        otherSeen.add(proxyName);
      }
    });

    const activeRegions = regionGroupsData
      .map((r) => ({ ...r, proxies: uniq(r.proxies) }))
      .filter((r) => r.proxies.length > 0);

    const activeRegionNameSet = new Set(activeRegions.map((r) => r.name));
    const activeRegionMap = new Map(activeRegions.map((r) => [r.name, r]));

    return {
      activeRegions,
      activeRegionNameSet,
      activeRegionMap,
      otherProxyNames: uniq(otherProxyNames)
    };
  };

  // AI 默认优先排除 HK；如果没有可用的非 HK 节点，则回退到全部节点
  const buildAiProxyList = (activeRegions = [], otherProxyNames = [], allNormalNames = []) => {
    const nonHkProxyNames = uniq([
      ...activeRegions.filter((r) => r.name !== "HK").flatMap((r) => r.proxies),
      ...otherProxyNames
    ]);
    return nonHkProxyNames.length > 0 ? nonHkProxyNames : allNormalNames;
  };

  // ====================
  // 4. 策略组
  // ====================
  const createGroupFactory = (proxyGroups, iconBase) => {
    return (name, type, proxies, icon = "Available.png", extra = {}) => {
      const uniqueProxies = uniq(proxies);
      if (!name || uniqueProxies.length === 0) return;
      proxyGroups.push({
        name,
        type,
        proxies: uniqueProxies,
        icon: iconBase + icon,
        ...extra
      });
    };
  };

  const buildMainSelectOptions = ({
    allNormalNames,
    aiProxies,
    activeRegionNameSet,
    regionOrder,
    otherProxyNames
  }) => {
    const selectOptions = [];
    if (allNormalNames.length) selectOptions.push("全部");
    if (aiProxies.length) selectOptions.push("AI");

    regionOrder.forEach((name) => {
      if (activeRegionNameSet.has(name)) selectOptions.push(name);
    });

    if (otherProxyNames.length) selectOptions.push("Other");

    selectOptions.push("DIRECT");
    return uniq(selectOptions);
  };

  // Info 分组保留，但不放进“选择”里，避免日常切换时干扰
  const buildProxyGroups = ({
    allNormalNames,
    aiProxies,
    activeRegionMap,
    activeRegionNameSet,
    otherProxyNames,
    infoNames
  }) => {
    const proxyGroups = [];
    const createGroup = createGroupFactory(proxyGroups, SETTINGS.ICON_BASE);

    const selectOptions = buildMainSelectOptions({
      allNormalNames,
      aiProxies,
      activeRegionNameSet,
      regionOrder: SETTINGS.REGION_ORDER,
      otherProxyNames
    });

    createGroup("选择", "select", selectOptions.length ? selectOptions : ["DIRECT"], "Proxy.png");

    if (allNormalNames.length) {
      createGroup("全部", "select", ["URL Test - 全部", "Fallback - 全部", ...allNormalNames], "Available.png");
    }

    if (aiProxies.length) {
      createGroup("AI", "select", ["URL Test - AI", "Fallback - AI", ...aiProxies], "ChatGPT.png");
    }

    SETTINGS.REGION_ORDER.forEach((rName) => {
      const region = activeRegionMap.get(rName);
      if (region) {
        createGroup(region.name, "select", [`URL Test - ${region.name}`, ...region.proxies], region.icon);
      }
    });

    if (otherProxyNames.length) {
      createGroup("Other", "select", ["URL Test - Other", ...otherProxyNames], "Available.png");
    }

    if (infoNames.length) {
      createGroup("Info", "select", infoNames, "Available.png");
    }

    if (allNormalNames.length) {
      createGroup("URL Test - 全部", "url-test", allNormalNames, "Available.png", SETTINGS.URL_TEST_EXTRA);
      createGroup("Fallback - 全部", "fallback", allNormalNames, "Available.png", SETTINGS.FALLBACK_EXTRA);
    }

    if (aiProxies.length) {
      createGroup("URL Test - AI", "url-test", aiProxies, "ChatGPT.png", SETTINGS.URL_TEST_EXTRA);
      createGroup("Fallback - AI", "fallback", aiProxies, "ChatGPT.png", SETTINGS.FALLBACK_EXTRA);
    }

    SETTINGS.REGION_ORDER.forEach((rName) => {
      const region = activeRegionMap.get(rName);
      if (region) {
        createGroup(`URL Test - ${region.name}`, "url-test", region.proxies, region.icon, SETTINGS.URL_TEST_EXTRA);
      }
    });

    if (otherProxyNames.length) {
      createGroup("URL Test - Other", "url-test", otherProxyNames, "Available.png", SETTINGS.URL_TEST_EXTRA);
    }

    return proxyGroups;
  };

  // ====================
  // 5. 规则
  // ====================
  const createRuleProvider = ({ key, file, behavior }) => ({
    url: `${SETTINGS.RULE_BASE}${file}`,
    path: `./ruleset/metacubex/${key}.yaml`,
    behavior,
    interval: 86400,
    format: "yaml",
    type: "http"
  });

  const buildRuleProviders = () => ({
    PrivateDomain: createRuleProvider({ key: "private_domain", file: "geosite/private.yaml", behavior: "domain" }),
    PrivateIP: createRuleProvider({ key: "private_ip", file: "geoip/private.yaml", behavior: "ipcidr" }),
    GoogleCN: createRuleProvider({ key: "google_cn", file: "geosite/google-cn.yaml", behavior: "domain" }),
    Synology: createRuleProvider({ key: "synology", file: "geosite/synology.yaml", behavior: "domain" }),
    OpenAI: createRuleProvider({ key: "openai", file: "geosite/openai.yaml", behavior: "domain" }),
    Anthropic: createRuleProvider({ key: "anthropic", file: "geosite/anthropic.yaml", behavior: "domain" }),
    GoogleGemini: createRuleProvider({ key: "google_gemini", file: "geosite/google-gemini.yaml", behavior: "domain" }),
    Ads: createRuleProvider({ key: "ads", file: "geosite/category-ads-all.yaml", behavior: "domain" }),
    GFW: createRuleProvider({ key: "gfw", file: "geosite/gfw.yaml", behavior: "domain" }),
    ChinaDomain: createRuleProvider({ key: "cn", file: "geosite/cn.yaml", behavior: "domain" })
  });

  const buildRules = (bypassDomains = []) => {
    const bypassDomainsUniq = uniq(bypassDomains);

    return [
      "RULE-SET,PrivateDomain,DIRECT",
      "RULE-SET,PrivateIP,DIRECT,no-resolve",

      "RULE-SET,GoogleCN,DIRECT",
      "RULE-SET,Synology,DIRECT",
      "DOMAIN-SUFFIX,sharepoint.com,DIRECT",
      ...bypassDomainsUniq.map((d) => `DOMAIN-SUFFIX,${d},DIRECT`),

      ...SETTINGS.DIRECT_FIX_RULES,

      "RULE-SET,Ads,REJECT",

      "RULE-SET,OpenAI,AI",
      "RULE-SET,Anthropic,AI",
      "RULE-SET,GoogleGemini,AI",
      "RULE-SET,GFW,选择",
      "RULE-SET,ChinaDomain,DIRECT",
      "GEOIP,CN,DIRECT,no-resolve",
      "MATCH,选择"
    ];
  };

  // ====================
  // 6. 网络配置
  // ====================
  const applySniffer = (inputConfig) => {
    inputConfig.sniffer = {
      ...inputConfig.sniffer,
      enable: true,
      "force-dns-mapping": true,
      "parse-pure-ip": true,
      "override-destination": true,
      sniff: {
        HTTP: { ports: [80, "8080-8880"], "override-destination": true },
        TLS: { ports: [443, 8443] },
        QUIC: { ports: [443, 8443] }
      },
      "force-domain": SETTINGS.FORCE_DOMAIN
    };
  };

  const applyTun = (inputConfig) => {
    inputConfig.tun = {
      ...inputConfig.tun,
      enable: true,
      stack: "system",
      "auto-route": true,
      "auto-detect-interface": true,
      "strict-route": true,
      "dns-hijack": ["any:53", "tcp://any:53"]
    };
  };

  // 如客户端自带 DNS 覆写功能，请关闭，避免与本脚本冲突
  const applyDns = (inputConfig) => {
    const existingFakeIpFilter = Array.isArray(inputConfig.dns?.["fake-ip-filter"])
      ? inputConfig.dns["fake-ip-filter"]
      : [];
    const mergedFakeIpFilter = uniq([...existingFakeIpFilter, ...SETTINGS.BASIC_FAKE_IP_FILTER]);

    inputConfig.dns = {
      ...inputConfig.dns,
      enable: true,
      "cache-algorithm": "arc",
      listen: inputConfig.dns?.listen,
      ipv6: inputConfig.dns?.ipv6,
      "enhanced-mode": "fake-ip",
      "fake-ip-filter": mergedFakeIpFilter,
      "default-nameserver": ["223.5.5.5", "119.29.29.29"],
      "nameserver-policy": {
        "geosite:cn": ["223.5.5.5#DIRECT", "119.29.29.29#DIRECT"],
        "geosite:private": "system",
        "rule-set:OpenAI": ["https://1.1.1.1/dns-query#AI", "https://8.8.8.8/dns-query#AI"],
        "rule-set:Anthropic": ["https://1.1.1.1/dns-query#AI", "https://8.8.8.8/dns-query#AI"],
        "rule-set:GoogleGemini": ["https://1.1.1.1/dns-query#AI", "https://8.8.8.8/dns-query#AI"]
      },
      nameserver: ["https://1.1.1.1/dns-query#选择", "https://8.8.8.8/dns-query#选择"],
      "proxy-server-nameserver": ["223.5.5.5#DIRECT", "119.29.29.29#DIRECT", "system"],
      "direct-nameserver": ["223.5.5.5#DIRECT", "119.29.29.29#DIRECT", "system"],
      "direct-nameserver-follow-policy": true
    };
  };

  const applyProfile = (inputConfig) => {
    inputConfig.profile = {
      ...inputConfig.profile,
      "store-selected": true,
      "store-fake-ip": false
    };
  };

  // ====================
  // 7. 主流程
  // ====================
  config = ensureConfigObject(config);

  const originalProxies = getOriginalProxies(config);
  if (originalProxies.length === 0) return config;

  makeProxyNamesUnique(originalProxies);

  const { infoProxies, normalProxies } = splitInfoAndNormalProxies(originalProxies, SETTINGS.FILTER_REGEX);

  const {
    activeRegions,
    activeRegionNameSet,
    activeRegionMap,
    otherProxyNames
  } = classifyProxiesByRegion(normalProxies, REGIONS);

  const allNormalNames = uniq(normalProxies.map((p) => p.name));
  const infoNames = uniq(infoProxies.map((p) => p.name));
  const aiProxies = buildAiProxyList(activeRegions, otherProxyNames, allNormalNames);

  config["proxy-groups"] = buildProxyGroups({
    allNormalNames,
    aiProxies,
    activeRegionMap,
    activeRegionNameSet,
    otherProxyNames,
    infoNames
  });

  config["rule-providers"] = buildRuleProviders();
  config.rules = buildRules(bypassDomains);

  applySniffer(config);
  applyTun(config);
  applyDns(config);
  applyProfile(config);

  config.proxies = originalProxies;
  return config;
}
