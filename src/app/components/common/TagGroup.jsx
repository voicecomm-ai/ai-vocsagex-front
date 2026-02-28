'use client';
import { Tag } from 'antd';

const { CheckableTag } = Tag;

export default function TagGroup({ list, selectedTags, onChange, keyField = 'id', labelField = 'name' }) {
  return (
    <div>
      {list.map(tag => {
        const key = tag[keyField];
        const label = tag[labelField];
        const isChecked = selectedTags.includes(tag);

        return (
          <CheckableTag
            key={key}
            checked={isChecked}
            onChange={checked => onChange(tag, checked)}
            style={{
              borderRadius: '8px',
              padding: '8px 18px',
              border: '1px solid #d9d9d9',
              backgroundColor: isChecked ? '#E3EAF7' : '#F2F3F5',
              color: isChecked ? '#3772FE' : '#666E82',
              fontWeight: isChecked ? '500' : 'normal',
              fontSize: '14px',
              marginBottom: 16,
              marginRight: 8,
              cursor: 'pointer',
            }}
          >
            {label}
          </CheckableTag>
        );
      })}
    </div>
  );
}
