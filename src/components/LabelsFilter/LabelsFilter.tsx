import "./LabelsFilter.css";
import { type ILabel, Label, getFullLabelName } from "../Label/Label";

export type LabelsFilterProps = {
  labels: ILabel[];
  onToggleLabel: (label: ILabel) => void;
};

export function LabelsFilterTree({ labels, onToggleLabel }: LabelsFilterProps) {
  console.log("LabelsFilterTree", labels);
  return (
    <div className="label-tree-content">
      {labels
        .filter((label) => label.parent === undefined) // only root labels
        .map((label) => (
          <LabelNode key={label.label} labels={labels} label={label} onToggleLabel={onToggleLabel} />
        ))}
    </div>
  );
}

type LabelLinkProps = {
  labels: ILabel[];
  label: ILabel;
  prefix?: string;
  onToggleLabel: LabelsFilterProps["onToggleLabel"];
};

function LabelNode({ labels, label, onToggleLabel }: LabelLinkProps) {
  const isActive = label.isActive;
  const children = labels.filter((l) => {
    if (l.parent) {
      return getFullLabelName(l.parent) === getFullLabelName(label);
    }
    false;
  });
  const hasChildren = children.length > 0;
  const prefix = hasChildren ? (isActive ? "▼" : "▶") : (isActive ? "⊙" : "∅");
  const clazz = `label-link ${isActive ? "active" : ""}`;

  return (
    <div className="label-node">
      <div
        className="label-node-header"
        onClick={() => onToggleLabel(label)}
        onKeyUp={(e) => e.key === "Enter" && onToggleLabel(label)}
        tabIndex={0}
        role="button"
      >
        <div className={clazz}>
          <Label key={getFullLabelName(label)} label={label} prefix={prefix} />
        </div>
      </div>
      {isActive && hasChildren && (
        <div className="label-node-content">
          {children.map((child) => (
            <LabelNode key={child.label} labels={labels} label={child} onToggleLabel={onToggleLabel} />
          ))}
        </div>
      )}
    </div>
  );
}
