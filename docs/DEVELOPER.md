# Developer / agent notes

## Repo layout

```
AppleTvHome/
├── README.md
├── docs/
│   ├── HUONG-DAN-NGUOI-DUNG.md   # non-tech Vietnamese guide
│   └── DEVELOPER.md
├── .cursor/skills/samsung-appletv-home/
│   ├── SKILL.md
│   ├── interview.md
│   ├── owner-checklist.md
│   └── reference.md
├── config.xml
├── index.html
├── css/
├── js/
├── images/
└── scripts/
```

## Safety

See skill Hard safety rules. Never root. Never claim full Home replacement.

## First-time on a new TV

1. Owner completes Developer Mode (guide §B).
2. Connect SDB; read capability.
3. Register DUID on Samsung public distributor cert.
4. Interview (§ skill + interview.md).
5. Customize → build → install → guide Autorun Last App (§G).

## Versioning

Bump `config.xml` `version` on every install you ask the owner to trust.
