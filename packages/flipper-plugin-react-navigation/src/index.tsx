import React from 'react';
import { Typography } from 'antd';
import { CompassOutlined } from '@ant-design/icons';
import { PluginClient, usePlugin, createState, useValue } from 'flipper-plugin';
import {
  Layout,
  ManagedDataInspector,
  DetailSidebar,
  VirtualList,
  styled,
} from 'flipper';
import type { NavigationState, NavigationAction } from '@react-navigation/core';

type Update = {
  id: string;
  action: NavigationAction;
  state: NavigationState | undefined;
};

type Events = {
  action: Update;
  init: { id: string; state: NavigationState | undefined };
};

export function plugin(client: PluginClient<Events, {}>) {
  const updates = createState<Update[]>([], { persist: 'actions' });
  const selectedID = createState<string | null>(null, { persist: 'selection' });

  client.onMessage('init', () => {
    updates.set([]);
    selectedID.set(null);
  });

  client.onMessage('action', (action) => {
    updates.update((draft) => {
      draft.push(action);
    });
  });

  function setSelection(id: string) {
    const updatesData = updates.get();
    const lastId = updatesData[updatesData.length - 1]?.id;

    if (id === lastId) {
      selectedID.set(null);
    } else {
      selectedID.set(id);
    }
  }

  return {
    updates,
    selectedID,
    setSelection,
  };
}

const Row = styled.button<{ selected: boolean }>((props) => ({
  'appearance': 'none',
  'display': 'block',
  'fontFamily':
    'SFMono-Regular,Consolas,Liberation Mono,Menlo,Courier,monospace',
  'textAlign': 'left',
  'padding': '12px 18px',
  'color': props.selected ? '#fff' : '#000',
  'backgroundColor': props.selected ? '#4D85F5' : 'transparent',
  'border': 0,
  'boxShadow': 'inset 0 -1px 0 0 rgba(0, 0, 0, 0.1)',
  'width': '100%',
  'cursor': 'pointer',

  '&:hover': {
    backgroundColor: props.selected ? '#4D85F5' : 'rgba(0, 0, 0, 0.05)',
  },
}));

const Center = styled.div({
  display: 'flex',
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
});

const Faded = styled.div({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  opacity: 0.3,
});

const EmptyIcon = styled(CompassOutlined)({
  display: 'block',
  fontSize: 48,
  margin: 16,
  opacity: 0.8,
});

export function Component() {
  const instance = usePlugin(plugin);
  const updates = useValue(instance.updates);
  const selectedID = useValue(instance.selectedID);

  const selectedItem = selectedID
    ? updates.find((update) => update.id === selectedID)
    : updates[updates.length - 1];

  return updates.length ? (
    <>
      <VirtualList
        data={updates}
        rowHeight={48}
        renderRow={({ id, action }) => (
          <Row
            key={id}
            selected={selectedItem?.id === id}
            onClick={() => instance.setSelection(id)}
          >
            {action.type}
          </Row>
        )}
      />
      <DetailSidebar>
        {selectedItem && <Sidebar update={selectedItem} />}
      </DetailSidebar>
    </>
  ) : (
    <Center>
      <Faded>
        <EmptyIcon />
        <Typography.Title level={5}>
          Navigate in the app to see actions
        </Typography.Title>
      </Faded>
    </Center>
  );
}

function Sidebar({ update }: { update: Update }) {
  const { action, state } = update;

  return (
    <Layout.Container gap pad>
      <Typography.Title level={4}>Action</Typography.Title>
      <ManagedDataInspector data={action} expandRoot={false} />
      <Typography.Title level={4}>State</Typography.Title>
      <ManagedDataInspector data={state} expandRoot={false} />
    </Layout.Container>
  );
}