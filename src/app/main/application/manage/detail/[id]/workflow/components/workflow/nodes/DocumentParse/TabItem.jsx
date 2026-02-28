import React from 'react'
import styles from './docParse.module.css'

const TabItem = ({ item, isActive, onClick }) => {
  return (
    <div
      className={`${styles['test_container_tab_item']} ${isActive ? styles['test_container_tab_item_active'] : ''}`}
      onClick={() => onClick(item.key)}
    >
      {item.label}
    </div>
  )
}

export default TabItem

