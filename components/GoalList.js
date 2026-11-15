import { StyleSheet, View, Text, FlatList, Pressable,TouchableWithoutFeedback } from '../platform';
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import GoalItem from './GoalItem';
import TextFont from './TextFont';

const SKELETONS = [0, 1, 2, 3, 4, 5];

function GoalList(props, ref) {
const [list, setList] = useState(listTypes);
const [dropSlot, setDropSlot] = useState(null);
const dark = (props.theme || props.userObj.theme)?.background === '#0e1111';

function hoverSlot(slot) {
    setDropSlot((current) => {
        if (!slot && !current) return current;
        if (slot && current && slot.id === current.id && slot.before === current.before) return current;
        return slot;
    });
}

function setSelection(type){
    props.setListType(type);
    const next = list.map((obj) => ({ ...obj, selected: obj.id === type.id }));
    listTypes.forEach((element) => {
        element.selected = element.id === type.id;
    });
    setList(next);
}
const [count, setCount] = useState(0);

function resetGoalList() {
    setSelection(listTypes[0]);
}
useImperativeHandle(ref, () => ({
    resetGoalList
}));

return (
    <View>
        <View style={styles.listType}>
            {list.map((type) => (
                <Pressable
                    key={type.id}
                    style={[styles.listTypeItem, type.selected ? styles.selected : null]}
                    onPress={() => setSelection(type)}
                >
                    <TextFont style={styles.listTypeText}>{type.listType}</TextFont>
                </Pressable>
            ))}
        </View>
    {props.loading && !props.userGoals.length ? (
      <View aria-busy="true" aria-label="Loading goals" style={styles.goalSection}>
        {SKELETONS.map((delay, index) => (
          <View
            key={delay}
            className={dark ? 'mm-goal-skeleton mm-goal-skeleton-dark' : 'mm-goal-skeleton'}
            style={[
              styles.skeleton,
              {
                backgroundColor: dark ? 'rgba(255,249,239,0.10)' : (props.theme || props.userObj.theme).primary,
                '--mm-skel-delay': `${index * 90}ms`,
                marginBottom: index === SKELETONS.length - 1 ? '7%' : 15,
              },
            ]}
          />
        ))}
      </View>
    ) : (
    <FlatList style={styles.goalSection} onRefresh={props.refresh} refreshing={props.refreshing} extraData={props.theme} numColumns={1} data={props.userGoals} ItemSeparatorComponent={() => <View style={{ height: 15 }} />} renderItem={(itemData) => {
        return <GoalItem totalCount={props.userGoals.length} index={itemData.index} theme={props.theme || props.userObj.theme} value={itemData.item} onDeleteItem={props.deleteGoal} _id={itemData.item._id} complete={props.completeGoal} onView={props.onViewGoal} dropBefore={dropSlot && dropSlot.id === itemData.item._id && dropSlot.before} dropAfter={dropSlot && dropSlot.id === itemData.item._id && !dropSlot.before} onDragHover={hoverSlot} onReorder={props.onReorder}/>;
        }}
        keyExtractor={(item) => {
            return item._id;
    }}/>
    )}
    </View>
    );
};

export default forwardRef(GoalList);

const styles = StyleSheet.create({
    listType: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-evenly',
    },
    listTypeItem: {
        flex: 1,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listTypeText: {
        fontSize: 20,
        textAlign: 'center',
        color: 'gray',
    },
    selected: {
        borderTopWidth: 2,
        borderColor: 'gray'
    },
    goalSection: {
        padding: 10,
        paddingTop: 0,
        marginBottom: '7%',
    },
    skeleton: {
        height: 72,
        width: '100%',
        borderRadius: 15,
        overflow: 'hidden',
        position: 'relative',
    }
})
const listTypes = [
    {
        listType: 'All',
        id: 'All',
        style: styles.listTypeItem,
        selected: true,
    },
    {
        listType: 'Daily',
        id: 'daily',
        style: styles.listTypeItem,
        selected: false
    },
    {
        listType: 'To Do',
        id: 'ToDo',
        style: styles.listTypeItem,
        selected: false
    }
];