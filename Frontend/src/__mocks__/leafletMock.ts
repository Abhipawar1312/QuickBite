const leafletMock = {
  divIcon: jest.fn(() => ({})),
  latLng: (lat: number, lng: number) => ({ lat, lng }),
  latLngBounds: () => ({
     pad: jest.fn(),
  }),
  Icon: {
    Default: {
      prototype: {},
      mergeOptions: jest.fn(),
    },
  },
};

export default leafletMock;
